// An automated accessibility audit of the whole public surface.
//
// Be exact about what this is worth. axe finds roughly a third of what a
// human audit finds, and this one runs in happy-dom, which does no layout —
// so contrast, target size and focus order are all outside what it can
// see. `tests/utils/contrast.test.ts` measures the palette arithmetically,
// `e2e/a11y.spec.ts` runs the same rules in a real browser where the
// layout-dependent ones work, and `docs/SUPPORT.md` still says no screen
// reader has ever been pointed at this library, because none has.
//
// What it does catch is the class of defect that is invisible until
// somebody checks: a control with no accessible name, a role that swallows
// its own children, an ARIA attribute the element's role forbids. Six of
// those were sitting in the library when this file was written, and every
// one of them had passed nine hundred unit tests.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, type Component } from 'vue'
import axe from 'axe-core'

import HStack from '../../src/components/layout/HStack.vue'
import VStack from '../../src/components/layout/VStack.vue'
import ZStack from '../../src/components/layout/ZStack.vue'
import ScrollView from '../../src/components/layout/ScrollView.vue'
import LazyVGrid from '../../src/components/layout/LazyVGrid.vue'
import LazyHGrid from '../../src/components/layout/LazyHGrid.vue'
import Divider from '../../src/components/layout/Divider.vue'
import Overlay from '../../src/components/layout/Overlay.vue'
import Background from '../../src/components/layout/Background.vue'
import SVText from '../../src/components/text/SVText.vue'
import SVLabel from '../../src/components/text/SVLabel.vue'
import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'
import SVButton from '../../src/components/controls/SVButton.vue'
import Toggle from '../../src/components/controls/Toggle.vue'
import SVSlider from '../../src/components/controls/SVSlider.vue'
import Picker from '../../src/components/controls/Picker.vue'
import Stepper from '../../src/components/controls/Stepper.vue'
import DatePicker from '../../src/components/controls/DatePicker.vue'
import Menu from '../../src/components/controls/Menu.vue'
import ContextMenu from '../../src/components/controls/ContextMenu.vue'
import SVList from '../../src/components/data/SVList.vue'
import Form from '../../src/components/data/Form.vue'
import Section from '../../src/components/data/Section.vue'
import SwipeActions from '../../src/components/data/SwipeActions.vue'
import ProgressView from '../../src/components/feedback/ProgressView.vue'
import Gauge from '../../src/components/feedback/Gauge.vue'
import SVAlert from '../../src/components/feedback/SVAlert.vue'
import SVImage from '../../src/components/media/SVImage.vue'
import AsyncImage from '../../src/components/media/AsyncImage.vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import NavigationSplitView from '../../src/components/navigation/NavigationSplitView.vue'
import TabView from '../../src/components/navigation/TabView.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'
import FullScreenCover from '../../src/components/navigation/FullScreenCover.vue'

import App from '../../kitchen/src/App.vue'
import TodosView from '../../kitchen/src/screens/TodosView.vue'
import TodoDetailView from '../../kitchen/src/screens/TodoDetailView.vue'
import TodoEditorSheet from '../../kitchen/src/screens/TodoEditorSheet.vue'
import SettingsView from '../../kitchen/src/screens/SettingsView.vue'
import AppearanceView from '../../kitchen/src/screens/AppearanceView.vue'
import LibraryView from '../../kitchen/src/screens/LibraryView.vue'
import { restoreSeed, settings } from '../../kitchen/src/store'

/**
 * WCAG 2.1 A and AA — the level a public component library is judged at.
 * axe's `best-practice` tag is deliberately not here: it carries rules like
 * `region` and `landmark-one-main` that are about whole pages, and a
 * component mounted on its own would fail them for no reason a consumer
 * could act on.
 */
const STANDARD = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * happy-dom lays nothing out, so every rule that reads geometry or computed
 * colour would be answering from an empty room. Naming them here rather
 * than narrowing to a rule allow-list means a rule added to axe in a future
 * version arrives switched on, which is the direction an audit should fail.
 */
const NEEDS_LAYOUT = ['color-contrast', 'target-size', 'scrollable-region-focusable']

async function violations(): Promise<string[]> {
  const results = await axe.run(document.body, {
    runOnly: { type: 'tag', values: STANDARD },
    rules: Object.fromEntries(NEEDS_LAYOUT.map(id => [id, { enabled: false }])),
  })
  // The node, not just the count: a rule id on its own tells you a name is
  // missing and not which of forty elements is missing it.
  return results.violations.flatMap(v =>
    v.nodes.map(n => `${v.id} (${v.impact}) — ${v.help}\n    ${n.html.slice(0, 140)}`))
}

async function audit(component: Component, props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const wrapper = mount(component, { props, slots, attachTo: document.body })
  await flushPromises()
  const found = await violations()
  wrapper.unmount()
  return found
}

type Case = [name: string, component: Component, props?: Record<string, unknown>, slots?: Record<string, unknown>]

// Every component that renders anything a user can reach, in the state a
// consumer would put it in — named where it takes a name, because proving
// a control *can* be named is the other half of proving it warns when it
// is not.
const COMPONENTS: Case[] = [
  ['VStack', VStack, {}, { default: () => 'body' }],
  ['HStack', HStack, {}, { default: () => 'body' }],
  ['ZStack', ZStack, {}, { default: () => 'body' }],
  ['ScrollView', ScrollView, {}, { default: () => 'body' }],
  ['LazyVGrid', LazyVGrid, { columns: 2 }],
  ['LazyHGrid', LazyHGrid, { rows: 2 }],
  ['Divider', Divider],
  ['Overlay', Overlay, {}, { default: () => 'base', overlay: () => 'badge' }],
  ['Background', Background, {}, { default: () => 'content', background: () => 'behind' }],
  ['Text', SVText, {}, { default: () => 'body' }],
  ['Label', SVLabel, { systemImage: '📁' }, { default: () => 'Docs' }],
  ['TextField', SVTextField, { label: 'Name' }],
  ['SecureField', SecureField, { label: 'Password' }],
  ['TextEditor', TextEditor, { label: 'Notes' }],
  ['Button', SVButton, {}, { default: () => 'Tap' }],
  ['Toggle', Toggle, { modelValue: false, label: 'On' }],
  ['Slider', SVSlider, { modelValue: 5, label: 'Volume' }],
  ['Picker', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }], label: 'Letter' }],
  ['Picker (segmented)', Picker, {
    modelValue: 'a', options: [{ label: 'A', value: 'a' }], pickerStyle: 'segmented', label: 'Letter',
  }],
  ['Stepper', Stepper, { modelValue: 1, label: 'Count' }],
  ['DatePicker', DatePicker, { modelValue: '2026-01-01', label: 'Day' }],
  ['Menu', Menu, { label: 'More', actions: [{ label: 'One' }] }],
  ['ContextMenu', ContextMenu, { label: 'Row', actions: [{ label: 'One' }] }, { default: () => 'Item' }],
  ['List', SVList, {}, { default: () => 'row' }],
  ['Form', Form, {}, { default: () => 'body' }],
  ['Section', Section, { header: 'H', footer: 'F' }, { default: () => 'body' }],
  ['SwipeActions', SwipeActions, { trailing: [{ label: 'Delete' }] }, { default: () => 'Row' }],
  ['ProgressView', ProgressView, { value: 0.5, label: 'Loading' }],
  ['ProgressView (indeterminate)', ProgressView, { label: 'Loading' }],
  ['Gauge', Gauge, { value: 0.5, label: 'Meter' }],
  ['Gauge (linear)', Gauge, { value: 0.5, label: 'Meter', gaugeStyle: 'linear' }],
  ['Image', SVImage, { src: 'a.png', alt: 'A' }],
  ['Image (decorative)', SVImage, { src: 'a.png' }],
  ['AsyncImage', AsyncImage, { url: 'a.png', alt: 'A' }],
  ['NavigationStack', NavigationStack, { title: 'Home' }, { default: () => 'body' }],
  ['NavigationLink', NavigationLink, {}, { default: () => 'Row' }],
  ['NavigationSplitView', NavigationSplitView, { label: 'Menu' }, {
    sidebar: () => 'Side', default: () => 'Detail',
  }],
  ['TabView', TabView, { tabs: [{ id: 'one', label: 'One' }], modelValue: 'one' }],
  ['Sheet', Sheet, { isPresented: true, title: 'Sheet' }, { default: () => 'body' }],
  ['FullScreenCover', FullScreenCover, { isPresented: true, title: 'Cover' }, { default: () => 'body' }],
  ['Alert', SVAlert, { isPresented: true, title: 'Careful', actions: [{ label: 'OK' }] }],
]

describe('every component passes an automated audit', () => {
  it.each(COMPONENTS)('%s', async (_name, component, props, slots) => {
    expect(await audit(component, props ?? {}, slots ?? {})).toEqual([])
  })
})

// ContextMenu wraps whatever you give it, and what people give it is usually
// already interactive — a Button, a row that pushes a screen. The audit above
// wraps plain text, which cannot catch a wrapper that makes its own slot
// unreachable, so this is that case explicitly: the very thing the todo row
// was restructured to avoid, checked at the one component whose whole job is
// to wrap arbitrary content.
describe('ContextMenu does not swallow the interactive content it wraps', () => {
  it('with a Button inside', async () => {
    const withButton = { setup: () => () => h(ContextMenu, { label: 'Actions', actions: [{ label: 'Copy' }] }, {
      default: () => h(SVButton, null, { default: () => 'Open' }),
    }) } as Component
    const found = await audit(withButton)
    expect(found.join('\n'), 'a role over the wrapper would flatten the button out').not.toContain('nested-interactive')
    expect(found).toEqual([])
  })

  it('with a NavigationLink inside', async () => {
    const withLink = { setup: () => () => h(ContextMenu, { label: 'Actions', actions: [{ label: 'Copy' }] }, {
      default: () => h(NavigationLink, null, { default: () => 'Detail' }),
    }) } as Component
    expect(await audit(withLink)).toEqual([])
  })
})

describe('and so does the app built out of them', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
    restoreSeed()
    settings.hideCompleted.value = false
    settings.direction.value = 'auto'
  })

  // Kitchen is where components meet: a checkbox inside a link inside a
  // swipeable row is nobody's unit test and is exactly where the nesting
  // rules bite.
  const SCREENS: Case[] = [
    ['the whole app', App],
    ['the todo list', TodosView],
    ['a todo', TodoDetailView, { id: 'seed-1' }],
    ['the editor sheet', TodoEditorSheet, { isPresented: true }],
    ['settings', SettingsView],
    ['appearance', AppearanceView],
    ['the iPad library', LibraryView],
  ]

  it.each(SCREENS)('%s', async (_name, component, props) => {
    expect(await audit(component, props ?? {})).toEqual([])
  })

  it('right to left, where every layout property is mirrored', async () => {
    settings.direction.value = 'rtl'
    expect(await audit(App)).toEqual([])
  })
})

// A gate nobody has watched fail is a gate nobody knows is switched on.
// These are the six defects this file found on the day it was written,
// reproduced deliberately — if the audit stops catching them it has
// stopped being an audit.
describe('the audit catches what it was written to catch', () => {
  const injected = (render: () => unknown) => ({ setup: () => render }) as Component

  it('a select with no accessible name', async () => {
    const found = await audit(Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }] })
    expect(found.join('\n')).toContain('select-name')
  })

  it('a date field with no accessible name', async () => {
    expect((await audit(DatePicker, { modelValue: '2026-01-01' })).join('\n')).toContain('label')
  })

  it('a focusable control inside a role that has no children', async () => {
    const nested = injected(() => h(NavigationLink, null, {
      default: () => h('button', { type: 'button', 'aria-label': 'Tick' }, '☐'),
    }))
    expect((await audit(nested)).join('\n')).toContain('nested-interactive')
  })

  it('an ARIA attribute the element\'s role does not allow', async () => {
    const bad = injected(() => h('div', { 'aria-expanded': 'false' }, 'target'))
    expect((await audit(bad)).join('\n')).toContain('aria-allowed-attr')
  })
})
