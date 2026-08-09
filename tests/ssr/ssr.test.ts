// @vitest-environment node
//
// Renders the whole library on the server. This is the guard against any
// component or composable touching window/document/localStorage at setup or
// render time — in this environment those globals simply do not exist.
import { describe, it, expect } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  VStack, HStack, ZStack, Spacer, Divider, ScrollView, LazyVGrid, LazyHGrid,
  Text, Label,
  TextField, SecureField, TextEditor,
  Button, Toggle, Slider, Picker, Stepper,
  ForEach, List, Section,
  NavigationStack, NavigationLink, TabView, Sheet,
  Alert, ProgressView,
  TransitionView,
  useState, useBinding, useAppStorage, useFocusState,
  createEnvironmentKey, provideEnvironment, useEnvironment,
  withAnimation, usePreferredColorScheme, onChange, publisher,
} from '../../src'

const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
const tabs = [{ id: 'one', label: 'One' }]

const Kitchen = defineComponent({
  setup() {
    // every composable runs during SSR setup
    const count = useState(0)
    const bound = useBinding(() => count.value, v => { count.value = v })
    const stored = useAppStorage('ssr-test', 'default')
    const focused = useFocusState<'a' | 'b'>()
    const key = createEnvironmentKey<string>('ssr-env')
    provideEnvironment(key, 'value')
    const env = useEnvironment(key, 'fallback')
    onChange(count, () => {})
    publisher(count).debounce(100).sink(() => {})

    return () => h(VStack, { spacing: 8 }, () => [
      h(Text, { font: 'title' }, () => `count ${count.value} ${bound.value} ${stored.value} ${env} ${focused.value ?? ''}`),
      h(Label, { systemImage: '📎' }, () => 'Label'),
      h(HStack, { wrap: true }, () => [
        h(Button, { buttonStyle: 'borderedProminent' }, () => 'Tap'),
        h(Spacer),
        h(Toggle, { modelValue: true, label: 'Toggle' }),
      ]),
      h(ZStack, () => [h(Divider)]),
      h(ScrollView, { axes: 'horizontal' }, () => h(Text, () => 'scroll')),
      h(LazyVGrid, { columns: [{ adaptive: { minimum: 80 } }] }, () => h(Text, () => 'cell')),
      h(LazyHGrid, { rows: 2 }, () => h(Text, () => 'cell')),
      h(TextField, { modelValue: 'tf', focused: false }),
      h(SecureField, { modelValue: 'pw' }),
      h(TextEditor, { modelValue: 'note' }),
      h(Slider, { modelValue: 40 }),
      h(Picker, { modelValue: 'a', options, pickerStyle: 'segmented' }),
      h(Stepper, { modelValue: 3 }),
      h(ForEach as never, { items: ['x', 'y'] }, {
        default: ({ item }: { item: string }) => h(Text, () => item),
      }),
      h(List, { items: [{ id: 1 }] }, {
        default: () => h(Text, () => 'row'),
      }),
      h(Section, { header: 'Grouped', footer: 'note', collapsible: true }, () => h(Text, () => 'section-row')),
      h(ScrollView, { refreshable: () => Promise.resolve() }, () => h(Text, () => 'refreshable')),
      h(NavigationStack, { title: 'SSR' }, () => h(Text, () => 'content')),
      h(NavigationLink, () => h(Text, () => 'link')),
      h(TabView, { tabs, modelValue: 'one' }, { one: () => h(Text, () => 'tab') }),
      h(Sheet, { isPresented: false }, () => h(Text, () => 'sheet')),
      h(Alert, { isPresented: false, title: 'Alert' }),
      h(ProgressView, { value: 30, total: 100, progressViewStyle: 'linear' }),
      h(TransitionView, { transition: 'moveBottom' }, () => h(Text, () => 'motion')),
    ])
  },
})

describe('server-side rendering', () => {
  it('renders the full library without touching browser globals', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof document).toBe('undefined')

    const html = await renderToString(createSSRApp(Kitchen))

    // inject sees ancestors only, so same-component provide resolves the fallback
    expect(html).toContain('count 0 0 default fallback')
    expect(html).toContain('Toggle')
    expect(html).toContain('SSR')
  })

  it('useAppStorage degrades to plain reactive state without storage', () => {
    const state = useAppStorage('ssr-degrade', 7)
    expect(state.value).toBe(7)
    state.value = 9
    expect(state.value).toBe(9)
  })

  it('withAnimation applies the mutation without a document', async () => {
    let ran = false
    const result = await withAnimation(() => { ran = true; return 'done' })
    expect(ran).toBe(true)
    expect(result).toBe('done')
  })

  it('usePreferredColorScheme hands back inert state without a document', () => {
    const scheme = usePreferredColorScheme()
    expect(scheme.value).toBeNull()
    scheme.value = 'dark' // must not throw
  })
})
