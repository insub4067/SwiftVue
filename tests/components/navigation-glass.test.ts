import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationSplitView from '../../src/components/navigation/NavigationSplitView.vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import TabView from '../../src/components/navigation/TabView.vue'

function useCompactWidth() {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    media: '(min-width: 768px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('Liquid Glass navigation chrome', () => {
  it('keeps the NavigationStack header translucent above its content', () => {
    const wrapper = mount(NavigationStack, {
      props: { title: 'Settings', displayMode: 'inline' },
      attachTo: document.body,
    })

    expect(wrapper.find('.nav-header').classes()).toContain('swift-navigation-edge')
    wrapper.unmount()
  })

  it('floats the TabView bar above content with Liquid Glass', () => {
    const wrapper = mount(TabView, {
      props: {
        tabs: [
          { id: 'home', label: 'Home' },
          { id: 'settings', label: 'Settings' },
        ],
      },
      slots: { home: '<p>Home</p>', settings: '<p>Settings</p>' },
      attachTo: document.body,
    })
    const bar = wrapper.find('.tab-bar')

    expect(bar.classes()).toContain('tab-bar--floating')
    expect(bar.classes()).toContain('swift-liquid-glass')
    wrapper.unmount()
  })

  it('uses a legible Liquid Glass surface for an overlaid split sidebar', () => {
    useCompactWidth()
    const wrapper = mount(NavigationSplitView, {
      props: { columnVisibility: 'doubleColumn' },
      slots: { sidebar: '<p>Sidebar</p>', detail: '<p>Detail</p>' },
      attachTo: document.body,
    })

    const sidebar = wrapper.find('.swift-split-sidebar')
    expect(sidebar.classes()).toContain('swift-liquid-glass--prominent')
    expect(sidebar.classes()).toContain('swift-split-sidebar--toggle-space')
    wrapper.unmount()
  })

  it('renders the compact split toggle as a circular Liquid Glass control', () => {
    useCompactWidth()
    const wrapper = mount(NavigationSplitView, {
      slots: { sidebar: '<p>Sidebar</p>', detail: '<p>Detail</p>' },
      attachTo: document.body,
    })
    const toggle = wrapper.find('.swift-split-toggle')

    expect(toggle.classes()).toContain('swift-liquid-glass')
    expect(toggle.classes()).toContain('swift-liquid-glass--circle')
    wrapper.unmount()
  })
})
