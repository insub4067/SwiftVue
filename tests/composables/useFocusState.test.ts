import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { useFocusState } from '../../src/composables/useFocusState'
import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'

describe('useFocusState', () => {
  it('starts with nothing focused', () => {
    expect(useFocusState().value).toBeNull()
  })

  it('accepts an initial value', () => {
    expect(useFocusState<'user' | 'pass'>('user').value).toBe('user')
  })

  it('is writable', () => {
    const state = useFocusState()
    state.value = true
    expect(state.value).toBe(true)
  })
})

// The boolean form — SwiftUI's `.focused($isFocused)`.
describe('focused (boolean form)', () => {
  it('focuses the field when set to true', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: false },
      attachTo: document.body,
    })
    expect(document.activeElement).not.toBe(wrapper.element)

    await wrapper.setProps({ focused: true })
    expect(document.activeElement).toBe(wrapper.element)
    wrapper.unmount()
  })

  it('blurs the field when set back to false', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: true },
      attachTo: document.body,
    })
    expect(document.activeElement).toBe(wrapper.element)

    await wrapper.setProps({ focused: false })
    expect(document.activeElement).not.toBe(wrapper.element)
    wrapper.unmount()
  })

  it('focuses on mount when already true', () => {
    const wrapper = mount(SVTextField, {
      props: { focused: true },
      attachTo: document.body,
    })
    expect(document.activeElement).toBe(wrapper.element)
    wrapper.unmount()
  })

  it('reports focus gained by the user', async () => {
    const wrapper = mount(SVTextField, { props: { focused: false }, attachTo: document.body })
    await wrapper.trigger('focus')
    expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([true])
    wrapper.unmount()
  })

  it('reports focus lost by the user', async () => {
    const wrapper = mount(SVTextField, { props: { focused: true }, attachTo: document.body })
    await wrapper.trigger('blur')
    expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('stays silent when the field is not bound to any focus state', async () => {
    const wrapper = mount(SVTextField, { attachTo: document.body })
    await wrapper.trigger('focus')
    await wrapper.trigger('blur')
    expect(wrapper.emitted('update:focused')).toBeUndefined()
    wrapper.unmount()
  })
})

// The tagged form — SwiftUI's `.focused($field, equals: .username)`.
describe('focused (focusValue form)', () => {
  it('focuses only the field whose tag matches', async () => {
    const user = mount(SVTextField, {
      props: { focused: null, focusValue: 'user' },
      attachTo: document.body,
    })
    const pass = mount(SecureField, {
      props: { focused: null, focusValue: 'pass' },
      attachTo: document.body,
    })

    await user.setProps({ focused: 'pass' })
    await pass.setProps({ focused: 'pass' })
    expect(document.activeElement).toBe(pass.element)

    await user.setProps({ focused: 'user' })
    await pass.setProps({ focused: 'user' })
    expect(document.activeElement).toBe(user.element)

    user.unmount()
    pass.unmount()
  })

  it('clears focus when set to null', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: 'user', focusValue: 'user' },
      attachTo: document.body,
    })
    expect(document.activeElement).toBe(wrapper.element)

    await wrapper.setProps({ focused: null })
    expect(document.activeElement).not.toBe(wrapper.element)
    wrapper.unmount()
  })

  it('reports its own tag when focused by the user', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: null, focusValue: 'user' },
      attachTo: document.body,
    })
    await wrapper.trigger('focus')
    expect(wrapper.emitted('update:focused')?.at(-1)).toEqual(['user'])
    wrapper.unmount()
  })

  it('clears the shared state when it loses focus', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: 'user', focusValue: 'user' },
      attachTo: document.body,
    })
    await wrapper.trigger('blur')
    expect(wrapper.emitted('update:focused')?.at(-1)).toEqual([null])
    wrapper.unmount()
  })

  it('does not clear state owned by another field', async () => {
    const wrapper = mount(SVTextField, {
      props: { focused: 'pass', focusValue: 'user' },
      attachTo: document.body,
    })
    await wrapper.trigger('blur')
    expect(wrapper.emitted('update:focused')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('focus binding across input components', () => {
  const cases = [
    ['TextField', SVTextField],
    ['SecureField', SecureField],
    ['TextEditor', TextEditor],
  ] as const

  for (const [name, Component] of cases) {
    it(`${name} honours the focused prop`, async () => {
      const wrapper = mount(Component, { props: { focused: false }, attachTo: document.body })
      await wrapper.setProps({ focused: true })
      expect(document.activeElement).toBe(wrapper.element)
      wrapper.unmount()
    })

    it(`${name} exposes focus() and blur()`, async () => {
      const wrapper = mount(Component, { attachTo: document.body })
      ;(wrapper.vm as unknown as { focus: () => void }).focus()
      expect(document.activeElement).toBe(wrapper.element)
      ;(wrapper.vm as unknown as { blur: () => void }).blur()
      expect(document.activeElement).not.toBe(wrapper.element)
      wrapper.unmount()
    })
  }
})
