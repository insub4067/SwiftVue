// A control with no accessible name is a critical failure that looks like
// nothing at all: the component renders, the styling is right, the mouse
// works. Only a screen reader notices, and by then it has shipped.
//
// So the library says so at the point of use. These tests are what stop
// that warning from being decorative — that it fires, that it names the
// component, and that it stays quiet for every legitimate way of naming a
// control, because a warning that cries wolf gets filtered out and then it
// is worth less than nothing.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'

import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'
import Picker from '../../src/components/controls/Picker.vue'
import DatePicker from '../../src/components/controls/DatePicker.vue'

const OPTIONS = [{ label: 'A', value: 'a' }]

function warningsFrom(component: Component, props: Record<string, unknown> = {}) {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  mount(component, { props }).unmount()
  return spy.mock.calls.flat().filter(m => typeof m === 'string' && m.includes('[SwiftVue]')) as string[]
}

afterEach(() => vi.restoreAllMocks())

describe('an unnamed control complains', () => {
  const NAMELESS: Array<[string, Component, Record<string, unknown>]> = [
    ['TextField', SVTextField, {}],
    ['SecureField', SecureField, {}],
    ['TextEditor', TextEditor, {}],
    ['Picker', Picker, { options: OPTIONS, modelValue: 'a' }],
    ['DatePicker', DatePicker, { modelValue: '2026-01-01' }],
  ]

  it.each(NAMELESS)('%s', (name, component, props) => {
    const [warning, ...rest] = warningsFrom(component, props)
    expect(warning, `<${name}> should say it has no name`).toContain(`<${name}> has no accessible name`)
    expect(rest, 'once, not once per render').toEqual([])
  })
})

describe('and a named one does not', () => {
  it.each([
    ['the label prop', { label: 'Name' }],
    ['a placeholder, which is weak but is a name', { placeholder: 'Name' }],
    ['aria-label passed through', { 'aria-label': 'Name' }],
    ['aria-labelledby pointing at the text beside it', { 'aria-labelledby': 'row-title' }],
  ])('%s', (_why, props) => {
    expect(warningsFrom(SVTextField, props)).toEqual([])
  })

  // An id is not a name. `<input id="email">` with no `<label for="email">`
  // anywhere is exactly the silent failure this check exists to catch, and
  // whether a matching label exists cannot be known from the id alone. So the
  // id does not buy silence — a `<label for>` user points aria-labelledby at
  // the same label, or passes label.
  it('but an id alone does not, because an id names nothing', () => {
    const [warning] = warningsFrom(SVTextField, { id: 'email' })
    expect(warning).toContain('has no accessible name')
  })
})

describe('the name reaches the element a screen reader reads', () => {
  it('TextField', () => {
    const wrapper = mount(SVTextField, { props: { label: 'Full name' } })
    expect(wrapper.find('input').attributes('aria-label')).toBe('Full name')
  })

  it('TextEditor', () => {
    const wrapper = mount(TextEditor, { props: { label: 'Notes' } })
    expect(wrapper.find('textarea').attributes('aria-label')).toBe('Notes')
  })

  it('Picker, as a select', () => {
    const wrapper = mount(Picker, { props: { options: OPTIONS, modelValue: 'a', label: 'Letter' } })
    expect(wrapper.find('select').attributes('aria-label')).toBe('Letter')
  })

  // The segmented style is a different element entirely, and naming one of
  // the two would have been the easiest thing in the world to miss.
  it('Picker, as a segmented control', () => {
    const wrapper = mount(Picker, {
      props: { options: OPTIONS, modelValue: 'a', label: 'Letter', pickerStyle: 'segmented' },
    })
    const group = wrapper.find('[role="radiogroup"]')
    expect(group.attributes('aria-label')).toBe('Letter')
    expect(group.find('[role="radio"]').attributes('aria-checked'),
      'and which one is chosen, which was style-only before').toBe('true')
  })
})
