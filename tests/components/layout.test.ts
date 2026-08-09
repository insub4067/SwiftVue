import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VStack from '../../src/components/layout/VStack.vue'
import HStack from '../../src/components/layout/HStack.vue'
import ZStack from '../../src/components/layout/ZStack.vue'
import Spacer from '../../src/components/layout/Spacer.vue'
import Divider from '../../src/components/layout/Divider.vue'

describe('VStack', () => {
  it('renders slot content', () => {
    const wrapper = mount(VStack, { slots: { default: '<span>Child</span>' } })
    expect(wrapper.text()).toBe('Child')
  })

  it('applies flex column layout', () => {
    const wrapper = mount(VStack)
    expect(wrapper.element.style.flexDirection).toBe('column')
    expect(wrapper.element.style.display).toBe('flex')
  })

  it('uses spacing prop', () => {
    const wrapper = mount(VStack, { props: { spacing: 20 } })
    expect(wrapper.element.style.gap).toBe('20px')
  })

  it('defaults to center alignment', () => {
    const wrapper = mount(VStack)
    expect(wrapper.element.style.alignItems).toBe('center')
  })

  it('applies leading alignment', () => {
    const wrapper = mount(VStack, { props: { alignment: 'leading' } })
    expect(wrapper.element.style.alignItems).toBe('flex-start')
  })
})

describe('HStack', () => {
  it('renders with flex row layout', () => {
    const wrapper = mount(HStack)
    expect(wrapper.element.style.flexDirection).toBe('row')
  })

  it('uses spacing prop', () => {
    const wrapper = mount(HStack, { props: { spacing: 12 } })
    expect(wrapper.element.style.gap).toBe('12px')
  })

  it('applies bottom alignment', () => {
    const wrapper = mount(HStack, { props: { alignment: 'bottom' } })
    expect(wrapper.element.style.alignItems).toBe('flex-end')
  })
})

describe('ZStack', () => {
  it('renders with grid layout', () => {
    const wrapper = mount(ZStack)
    expect(wrapper.element.style.display).toBe('grid')
  })

  it('has relative position', () => {
    const wrapper = mount(ZStack)
    expect(wrapper.element.style.position).toBe('relative')
  })
})

describe('Spacer', () => {
  it('has flex-grow 1', () => {
    const wrapper = mount(Spacer)
    expect(wrapper.element.style.flexGrow).toBe('1')
  })

  it('applies minLength', () => {
    const wrapper = mount(Spacer, { props: { minLength: 20 } })
    expect(wrapper.element.style.minWidth).toBe('20px')
    expect(wrapper.element.style.minHeight).toBe('20px')
  })
})

describe('Divider', () => {
  it('renders as hr', () => {
    const wrapper = mount(Divider)
    expect(wrapper.element.tagName).toBe('HR')
  })

  it('applies default thickness', () => {
    const wrapper = mount(Divider)
    expect(wrapper.element.style.height).toBe('1px')
  })

  it('applies custom thickness and color', () => {
    const wrapper = mount(Divider, { props: { thickness: 3, color: '#000' } })
    expect(wrapper.element.style.height).toBe('3px')
    expect(wrapper.element.style.backgroundColor).toBe('#000')
  })
})
