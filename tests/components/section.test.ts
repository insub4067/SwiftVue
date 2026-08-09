import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Section from '../../src/components/data/Section.vue'

describe('Section', () => {
  it('renders header, rows and footer', () => {
    const wrapper = mount(Section, {
      props: { header: 'Profile', footer: 'Synced across devices.' },
      slots: { default: '<div class="swift-list-row">Row</div>' },
    })
    expect(wrapper.find('.section-header').text()).toBe('Profile')
    expect(wrapper.text()).toContain('Row')
    expect(wrapper.find('.section-footer').text()).toBe('Synced across devices.')
  })

  it('omits header and footer elements when not provided', () => {
    const wrapper = mount(Section, { slots: { default: 'Row' } })
    expect(wrapper.find('.section-header').exists()).toBe(false)
    expect(wrapper.find('.section-footer').exists()).toBe(false)
  })

  it('accepts header and footer slots over props', () => {
    const wrapper = mount(Section, {
      slots: { header: '<b>Custom</b>', default: 'Row' },
    })
    expect(wrapper.find('.section-header b').exists()).toBe(true)
  })

  it('a plain section has no button semantics', () => {
    const wrapper = mount(Section, { props: { header: 'Plain' } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  describe('collapsible', () => {
    it('the header is a button wired to the body', () => {
      const wrapper = mount(Section, {
        props: { header: 'Advanced', collapsible: true },
        slots: { default: 'Row' },
      })
      const button = wrapper.find('button.section-header')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-expanded')).toBe('true')
      expect(button.attributes('aria-controls')).toBe(wrapper.find('.section-body').attributes('id'))
    })

    it('toggles closed and open on click', async () => {
      const wrapper = mount(Section, {
        props: { header: 'Advanced', collapsible: true },
        slots: { default: 'Row' },
      })
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.section-body').classes()).toContain('collapsed')
      expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')

      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.section-body').classes()).not.toContain('collapsed')
    })

    it('supports v-model:expanded', async () => {
      const wrapper = mount(Section, {
        props: { header: 'Advanced', collapsible: true, expanded: false },
        slots: { default: 'Row' },
      })
      expect(wrapper.find('.section-body').classes()).toContain('collapsed')

      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:expanded')?.at(-1)).toEqual([true])

      await wrapper.setProps({ expanded: true })
      expect(wrapper.find('.section-body').classes()).not.toContain('collapsed')
    })

    it('content stays mounted while collapsed — state is preserved', async () => {
      const wrapper = mount(Section, {
        props: { header: 'Advanced', collapsible: true },
        slots: { default: '<input id="field" />' },
      })
      const field = wrapper.find('#field').element as HTMLInputElement
      field.value = 'typed'

      await wrapper.find('button').trigger('click') // collapse
      await wrapper.find('button').trigger('click') // expand
      expect((wrapper.find('#field').element as HTMLInputElement).value).toBe('typed')
    })
  })
})
