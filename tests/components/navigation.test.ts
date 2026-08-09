import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import TabView from '../../src/components/navigation/TabView.vue'

describe('NavigationStack', () => {
  it('renders title in large mode', () => {
    const wrapper = mount(NavigationStack, { props: { title: 'Hello' } })
    expect(wrapper.find('h1').text()).toBe('Hello')
    expect(wrapper.find('.nav-header--large').exists()).toBe(true)
  })

  it('renders title in inline mode', () => {
    const wrapper = mount(NavigationStack, {
      props: { title: 'Hello', displayMode: 'inline' },
    })
    expect(wrapper.find('.nav-header--inline').exists()).toBe(true)
  })

  it('renders slot content', () => {
    const wrapper = mount(NavigationStack, {
      slots: { default: '<p>Content</p>' },
    })
    expect(wrapper.text()).toContain('Content')
  })

  it('hides header when no title', () => {
    const wrapper = mount(NavigationStack)
    expect(wrapper.find('header').exists()).toBe(false)
  })
})

describe('TabView', () => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'settings', label: 'Settings' },
  ]

  it('renders tab buttons', () => {
    const wrapper = mount(TabView, { props: { tabs } })
    const buttons = wrapper.findAll('[role="tab"]')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toContain('Home')
  })

  it('marks active tab with aria-selected', () => {
    const wrapper = mount(TabView, { props: { tabs, modelValue: 'settings' } })
    const buttons = wrapper.findAll('[role="tab"]')
    expect(buttons[0].attributes('aria-selected')).toBe('false')
    expect(buttons[1].attributes('aria-selected')).toBe('true')
  })

  it('emits update:modelValue on tab click', async () => {
    const wrapper = mount(TabView, { props: { tabs, modelValue: 'home' } })
    const buttons = wrapper.findAll('[role="tab"]')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['settings'])
  })

  it('has tablist role on nav', () => {
    const wrapper = mount(TabView, { props: { tabs } })
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
  })

  it('has tabpanel role on content', () => {
    const wrapper = mount(TabView, { props: { tabs } })
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true)
  })
})
