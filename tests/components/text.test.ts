import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SVText from '../../src/components/text/SVText.vue'
import SVLabel from '../../src/components/text/SVLabel.vue'

describe('Text', () => {
  it('renders slot content in a span', () => {
    const wrapper = mount(SVText, { slots: { default: 'Hello World' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toBe('Hello World')
  })

  it('applies font size from font prop', () => {
    const wrapper = mount(SVText, {
      props: { font: 'title' },
      slots: { default: 'Title' },
    })
    expect(wrapper.element.style.fontSize).toBe('28px')
  })

  it('applies bold', () => {
    const wrapper = mount(SVText, {
      props: { bold: true },
      slots: { default: 'Bold' },
    })
    expect(wrapper.element.style.fontWeight).toBe('700')
  })

  it('applies italic', () => {
    const wrapper = mount(SVText, {
      props: { italic: true },
      slots: { default: 'Italic' },
    })
    expect(wrapper.element.style.fontStyle).toBe('italic')
  })

  it('applies strikethrough', () => {
    const wrapper = mount(SVText, {
      props: { strikethrough: true },
      slots: { default: 'Struck' },
    })
    expect(wrapper.element.style.textDecoration).toBe('line-through')
  })

  it('applies overflow hidden for lineLimit', () => {
    const wrapper = mount(SVText, {
      props: { lineLimit: 2 },
      slots: { default: 'Clamped text' },
    })
    expect(wrapper.element.style.overflow).toBe('hidden')
  })

  it('applies text alignment', () => {
    const wrapper = mount(SVText, {
      props: { multilineTextAlignment: 'trailing' },
      slots: { default: 'Right aligned' },
    })
    expect(wrapper.element.style.textAlign).toBe('right')
  })
})

describe('Label', () => {
  it('renders with icon and text', () => {
    const wrapper = mount(SVLabel, {
      props: { systemImage: '⭐' },
      slots: { default: 'Favorites' },
    })
    expect(wrapper.text()).toContain('⭐')
    expect(wrapper.text()).toContain('Favorites')
  })

  it('hides icon span when no systemImage', () => {
    const wrapper = mount(SVLabel, {
      slots: { default: 'No Icon' },
    })
    const spans = wrapper.findAll('span')
    expect(spans).toHaveLength(1)
    expect(wrapper.text()).toBe('No Icon')
  })
})
