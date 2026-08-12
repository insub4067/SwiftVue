// Three fixes an external project surfaced by building on the library:
//   1. an inline `outline: none` beat the scoped `:focus-visible` ring on
//      specificity, so the keyboard focus indicator never showed;
//   2. some controls were shorter than the 44px minimum touch target, which
//      the app had to patch globally instead of the library guaranteeing it;
//   3. `transition: all` on the button could animate an unrelated size or
//      position change, not just the colour/press it meant to.
// These pin all three so they cannot quietly come back.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Component } from 'vue'

import SVButton from '../../src/components/controls/SVButton.vue'
import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'
import DatePicker from '../../src/components/controls/DatePicker.vue'
import Picker from '../../src/components/controls/Picker.vue'

const inlineStyle = (el: Element) => (el as HTMLElement).style

describe('the keyboard focus ring is not killed by an inline outline', () => {
  // Every interactive control that used to carry `outline: 'none'` inline.
  // The ring itself lives in scoped CSS, which happy-dom does not compute —
  // so the runtime check is that nothing overrides it inline, and a source
  // scan below proves the ring is actually there.
  const CASES: Array<[string, Component, Record<string, unknown>, string]> = [
    ['Button', SVButton, {}, 'button'],
    ['TextField', SVTextField, { label: 'n' }, 'input'],
    ['SecureField', SecureField, { label: 'n' }, 'input'],
    ['TextEditor', TextEditor, { label: 'n' }, 'textarea'],
    ['DatePicker', DatePicker, { modelValue: '2026-01-01', label: 'd' }, 'input'],
    ['Picker', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }], label: 'p' }, 'select'],
  ]

  it.each(CASES)('%s sets no inline outline', (_name, component, props, tag) => {
    const w = mount(component, { props, slots: { default: 'x' } })
    expect(inlineStyle(w.find(tag).element).outline, 'inline outline would beat :focus-visible').toBe('')
  })

  const FILES = [
    'src/components/controls/SVButton.vue',
    'src/components/input/SVTextField.vue',
    'src/components/input/SecureField.vue',
    'src/components/input/TextEditor.vue',
    'src/components/controls/DatePicker.vue',
    'src/components/controls/Picker.vue',
  ]

  it.each(FILES)('%s has a :focus-visible ring and no inline outline:none', (file) => {
    const src = readFileSync(resolve(process.cwd(), file), 'utf8')
    expect(src, 'the ring must exist for the removal to be safe').toContain(':focus-visible')
    expect(src, 'inline outline:none is what broke it').not.toMatch(/outline:\s*['"]none['"]/)
  })
})

describe('controls guarantee the 44px minimum touch target', () => {
  const CASES: Array<[string, Component, Record<string, unknown>, string]> = [
    ['Button', SVButton, {}, 'button'],
    ['TextField', SVTextField, { label: 'n' }, 'input'],
    ['SecureField', SecureField, { label: 'n' }, 'input'],
    ['DatePicker', DatePicker, { modelValue: '2026-01-01', label: 'd' }, 'input'],
    ['Picker', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }], label: 'p' }, 'select'],
  ]

  it.each(CASES)('%s is at least 44px tall, padding counted in', (_name, component, props, tag) => {
    const s = inlineStyle(mount(component, { props, slots: { default: 'x' } }).find(tag).element)
    expect(s.minHeight).toBe('44px')
    expect(s.boxSizing, 'border-box so the min includes padding, not adds to it').toBe('border-box')
  })

  it('a Button is at least 44px wide too, for an icon-only tap target', () => {
    const s = inlineStyle(mount(SVButton, { slots: { default: '+' } }).find('button').element)
    expect(s.minWidth).toBe('44px')
  })

  // The floor is a default, so a consumer can still ask for a smaller control.
  it('a frame minHeight still overrides the floor', () => {
    const s = inlineStyle(mount(SVButton, { props: { frame: { minHeight: 20 } }, slots: { default: 'x' } }).find('button').element)
    expect(s.minHeight).toBe('20px')
  })
})

describe('the button transitions only what changes, not `all`', () => {
  it('animates colour/press but never layout', () => {
    const s = inlineStyle(mount(SVButton, { slots: { default: 'x' } }).find('button').element)
    expect(s.transition, '`all` would sweep width, height, padding into the animation').not.toContain('all')
    expect(s.transition).toContain('transform')
    expect(s.transition).toContain('filter')
  })
})
