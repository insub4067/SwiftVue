// Compiled against the PACKED package, not the source tree: this is what a
// TypeScript consumer actually sees. It caught NavigationLink's #destination
// slot missing from the emitted declarations.
import { defineComponent, h, ref } from 'vue'
import {
  NavigationStack, NavigationLink, Section, ScrollView, Button, Text, TextField,
  LazyVGrid, TransitionView, List,
  Image, AsyncImage, Form, DatePicker, Menu, ContextMenu, Gauge,
  useFocusState, usePreferredColorScheme, useNavigation, onChange, publisher,
  withAnimation, Animations,
  type GridItem, type ColorScheme, type ModifierProps,
  type AlertAction, type PickerOption, type TabItem, type TransitionPreset,
  type SectionProps, type ListProps,
  type ImageProps, type AsyncImageProps, type AsyncImagePhase,
  type FormProps, type DatePickerProps, type MenuAction, type NavigationStackProps,
  type ContextMenuProps, type GaugeProps, type RouteRef, type RouteFactory,
} from 'swiftvue'

// the option/action shapes users write by hand
const actions: AlertAction[] = [{ label: 'Cancel', role: 'cancel' }, { label: 'OK' }]
const options: PickerOption[] = [{ value: 'a', label: 'A' }, { value: 1, label: 'One' }]
const tabs: TabItem[] = [{ id: 'home', label: 'Home', icon: '🏠', badge: 3 }]
const preset: TransitionPreset = 'moveBottom'
const sectionProps: SectionProps = { header: 'Group', collapsible: true, defaultExpanded: false }
const listProps: ListProps<{ id: number }> = { items: [{ id: 1 }], keyPath: 'id' }
const menuActions: MenuAction[] = [{ label: 'Rename', id: 1 }, { label: 'Delete', role: 'destructive' }]
const imageProps: ImageProps = { src: '/a.png', alt: 'A', resizable: true, contentMode: 'fill' }
const asyncProps: AsyncImageProps = { url: '/b.png', alt: 'B' }
const phase: AsyncImagePhase = 'success'
const formProps: FormProps = { spacing: 16 }
const dateProps: DatePickerProps = { modelValue: '2026-08-09', displayedComponents: 'dateAndTime' }
const stackProps: NavigationStackProps = { title: 'Home', browserBack: true, historyKey: 'app' }
const contextProps: ContextMenuProps = { actions: menuActions, longPressDelay: 400 }
const gaugeProps: GaugeProps = { value: 0.5, min: 0, max: 1, gaugeStyle: 'circular', tint: 'green' }
const route: RouteRef = { id: 'user', param: '42' }
const buildRoute: RouteFactory = (param) => ({ title: `User ${param}`, content: () => h(Text, () => 'user') })
void [actions, options, tabs, preset, sectionProps, listProps,
     menuActions, imageProps, asyncProps, phase, formProps, dateProps, stackProps,
     contextProps, gaugeProps, route, buildRoute]

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
    nav?.pushRoute('user', '42')
    const stopRoute = nav?.registerRoute('user', buildRoute)
    void stopRoute

    return () => h(NavigationStack, { title: 'Home' }, () => [
      h(Section, { header: 'Group', collapsible: true, defaultExpanded: false }, () => [
        // the slot that was missing from the declarations
        h(NavigationLink, { destinationTitle: 'Detail', route: 'detail', param: '1' }, {
          default: () => h(Text, () => 'Open'),
          destination: destinationSlot,
        }),
      ]),
      h(TextField, { modelValue: text.value, focused: focused.value, focusValue: 'a' }),
      h(Button, { buttonStyle: 'borderedProminent', onTap: () => {} }, () => 'Tap'),
      h(LazyVGrid, { columns, spacing: 8 }, () => h(Text, () => 'cell')),
      h(TransitionView, { transition: 'scale' }, () => h(Text, () => 'x')),
      h(ScrollView, { axes: 'vertical', refreshable: async () => {} }, () => h(Text, () => 'y')),
      // generic components lose inference through h(); the ListProps above
      // is what actually pins the prop types for consumers
      h(List as never, listProps, { default: () => h(Text, () => 'row') }),
      h(Text, { font: 'title', ...modifiers }, () => String(scheme)),
      h(Section, {}, { header: sectionHeaderSlot, default: () => h(Text, () => 'row') }),
      h(Image, imageProps),
      h(AsyncImage, asyncProps, { placeholder: () => h(Text, () => '…'), error: () => h(Text, () => '!') }),
      h(Form, { ...formProps, onSubmit: () => {} }, () => h(DatePicker, dateProps)),
      h(Menu, { label: 'More', actions: menuActions, onSelect: (a: MenuAction) => void a }),
      h(ContextMenu, contextProps, () => h(Text, () => 'long press me')),
      h(Gauge, gaugeProps),
    ])
  },
})
