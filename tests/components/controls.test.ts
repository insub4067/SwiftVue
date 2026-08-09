import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SVButton from '../../src/components/controls/SVButton.vue'
import Toggle from '../../src/components/controls/Toggle.vue'
import Stepper from '../../src/components/controls/Stepper.vue'
import Picker from '../../src/components/controls/Picker.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(SVButton, { slots: { default: 'Click me' } })
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits tap on click', async () => {
    const wrapper = mount(SVButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('tap')).toHaveLength(1)
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(SVButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('tap')).toBeUndefined()
  })

  it('applies borderedProminent style', () => {
    const wrapper = mount(SVButton, { props: { buttonStyle: 'borderedProminent' } })
    expect(wrapper.element.style.backgroundColor).toBe('var(--swift-primary)')
    expect(wrapper.element.style.color).toBe('#FFFFFF')
  })

  it('applies destructive role', () => {
    const wrapper = mount(SVButton, { props: { role: 'destructive', buttonStyle: 'borderedProminent' } })
    expect(wrapper.element.style.backgroundColor).toBe('var(--swift-red)')
  })

  it('applies fullWidth', () => {
    const wrapper = mount(SVButton, { props: { fullWidth: true } })
    expect(wrapper.element.style.width).toBe('100%')
  })
})

describe('Toggle', () => {
  it('renders with switch role', () => {
    const wrapper = mount(Toggle)
    expect(wrapper.attributes('role')).toBe('switch')
  })

  it('reflects aria-checked state', () => {
    const wrapper = mount(Toggle, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('toggles on Space key', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: false } })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('toggles on Enter key', async () => {
    const wrapper = mount(Toggle, { props: { modelValue: true } })
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('has tabindex 0 when not disabled', () => {
    const wrapper = mount(Toggle)
    expect(wrapper.attributes('tabindex')).toBe('0')
  })

  it('has tabindex -1 when disabled', () => {
    const wrapper = mount(Toggle, { props: { disabled: true } })
    expect(wrapper.attributes('tabindex')).toBe('-1')
  })
})

describe('Stepper', () => {
  it('renders current value', () => {
    const wrapper = mount(Stepper, { props: { modelValue: 5 } })
    expect(wrapper.find('.value').text()).toBe('5')
  })

  it('increments on + click', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 3, step: 1, min: 0, max: 10 } })
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4])
  })

  it('decrements on - click', async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 3, step: 1, min: 0, max: 10 } })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
  })

  it('disables decrement at min', () => {
    const wrapper = mount(Stepper, { props: { modelValue: 0, min: 0, max: 10 } })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('disabled')).toBeDefined()
  })

  it('disables increment at max', () => {
    const wrapper = mount(Stepper, { props: { modelValue: 10, min: 0, max: 10 } })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].attributes('disabled')).toBeDefined()
  })

  it('has ARIA group role', () => {
    const wrapper = mount(Stepper)
    expect(wrapper.find('.stepper').attributes('role')).toBe('group')
  })

  it('has aria-live on value', () => {
    const wrapper = mount(Stepper)
    expect(wrapper.find('.value').attributes('aria-live')).toBe('polite')
  })
})

describe('Picker', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Charlie' },
  ]

  it('renders options in select mode', () => {
    const wrapper = mount(Picker, { props: { options, modelValue: 'a' } })
    const optionEls = wrapper.findAll('option')
    expect(optionEls).toHaveLength(3)
    expect(optionEls[0].text()).toBe('Alpha')
  })

  it('renders segmented buttons', () => {
    const wrapper = mount(Picker, {
      props: { options, modelValue: 'a', pickerStyle: 'segmented' },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0].classes()).toContain('active')
  })

  it('emits original value type from select', async () => {
    const numOptions = [
      { value: 0, label: 'Zero' },
      { value: 1, label: 'One' },
    ]
    const wrapper = mount(Picker, { props: { options: numOptions, modelValue: 0 } })
    const select = wrapper.find('select')
    await select.setValue('1')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1])
  })

  it('emits string value from select for string options', async () => {
    const wrapper = mount(Picker, { props: { options, modelValue: 'a' } })
    const select = wrapper.find('select')
    await select.setValue('b')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
  })
})
