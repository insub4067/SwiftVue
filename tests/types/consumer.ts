// Compiled against the PACKED package, not the source tree: this is what a
// TypeScript consumer actually sees. It caught NavigationLink's #destination
// slot missing from the emitted declarations.
import { defineComponent, h, ref } from 'vue'
import {
  NavigationStack, NavigationLink, Section, ScrollView, Button, Text, TextField,
  LazyVGrid, TransitionView, List,
  useFocusState, usePreferredColorScheme, useNavigation, onChange, publisher,
  withAnimation, Animations,
  type GridItem, type ColorScheme, type ModifierProps,
} from 'swiftvue'

// h()'s slots argument is loosely typed, so naming a slot there proves
// nothing. Read the slot off the component's declared type instead — this
// is what fails when #destination is missing from the emitted .d.ts.
type SlotsOf<T> = T extends abstract new (...args: never) => { $slots: infer S } ? S : never
const destinationSlot: Required<SlotsOf<typeof NavigationLink>>['destination'] =
  () => h(Text, () => 'pushed view')
const sectionHeaderSlot: Required<SlotsOf<typeof Section>>['header'] = () => h(Text, () => 'header')

const columns: GridItem[] = [{ adaptive: { minimum: 100 } }, { fixed: 80 }, { flexible: {} }]
const scheme: ColorScheme | null = usePreferredColorScheme().value
const modifiers: ModifierProps = { padding: 16, frame: { maxWidth: '400px' } }

export default defineComponent({
  setup() {
    const text = ref('')
    const focused = useFocusState<'a' | 'b'>()
    const nav = useNavigation()

    onChange(text, (value, oldValue) => void [value, oldValue])
    publisher(text).map(s => s.trim()).removeDuplicates().debounce(300).sink(q => void q)
    void withAnimation(() => { text.value = 'x' }, Animations.spring)
    nav?.push({ title: 'Detail', content: () => h(Text, () => 'detail') })

    return () => h(NavigationStack, { title: 'Home' }, () => [
      h(Section, { header: 'Group', collapsible: true, defaultExpanded: false }, () => [
        // the slot that was missing from the declarations
        h(NavigationLink, { destinationTitle: 'Detail' }, {
          default: () => h(Text, () => 'Open'),
          destination: destinationSlot,
        }),
      ]),
      h(TextField, { modelValue: text.value, focused: focused.value, focusValue: 'a' }),
      h(Button, { buttonStyle: 'borderedProminent', onTap: () => {} }, () => 'Tap'),
      h(LazyVGrid, { columns, spacing: 8 }, () => h(Text, () => 'cell')),
      h(TransitionView, { transition: 'scale' }, () => h(Text, () => 'x')),
      h(ScrollView, { axes: 'vertical', refreshable: async () => {} }, () => h(Text, () => 'y')),
      h(List, { items: [1, 2], listStyle: 'insetGrouped' }, { default: () => h(Text, () => 'row') }),
      h(Text, { font: 'title', ...modifiers }, () => String(scheme)),
      h(Section, {}, { header: sectionHeaderSlot, default: () => h(Text, () => 'row') }),
    ])
  },
})
