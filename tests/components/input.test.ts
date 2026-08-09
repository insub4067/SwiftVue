import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'

describe('TextField', () => {
  it('renders an input element', () => {
    const wrapper = mount(SVTextField)
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('input').attributes('type')).toBe('text')
  })

  it('binds modelValue', () => {
    const wrapper = mount(SVTextField, { props: { modelValue: 'hello' } })
    expect(wrapper.find('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(SVTextField, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('test')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test'])
  })

  it('emits submit on Enter', async () => {
    const wrapper = mount(SVTextField)
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('applies placeholder', () => {
    const wrapper = mount(SVTextField, { props: { placeholder: 'Type here' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Type here')
  })

  it('applies disabled state', () => {
    const wrapper = mount(SVTextField, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('applies roundedBorder style', () => {
    const wrapper = mount(SVTextField, { props: { textFieldStyle: 'roundedBorder' } })
    expect(wrapper.find('input').element.style.borderRadius).toBe('8px')
  })
})

describe('SecureField', () => {
  it('renders a password input', () => {
    const wrapper = mount(SecureField)
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(SecureField, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('secret')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['secret'])
  })
})

describe('TextEditor', () => {
  it('renders a textarea', () => {
    const wrapper = mount(TextEditor)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(TextEditor, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('multiline text')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['multiline text'])
  })
})
