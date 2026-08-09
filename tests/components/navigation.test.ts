import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import TabView from '../../src/components/navigation/TabView.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'
import { useNavigation } from '../../src/composables/useNavigation'

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

describe('NavigationStack push/pop', () => {
  // a child that pushes a detail view through useNavigation
  const Pusher = defineComponent({
    setup() {
      const nav = useNavigation()!
      return () => h('button', {
        id: 'go',
        onClick: () => nav.push({ title: 'Detail', content: () => h('p', 'detail-content') }),
      }, 'go')
    },
  })

  function mountStack() {
    return mount(NavigationStack, {
      props: { title: 'Home' },
      slots: { default: () => h(Pusher) },
    })
  }

  it('push shows the destination with its title and a back button', async () => {
    const wrapper = mountStack()
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('detail-content')
    expect(wrapper.find('h1').text()).toBe('Detail')

    const back = wrapper.find('[aria-label="Back"]')
    expect(back.exists()).toBe(true)
    expect(back.text()).toContain('Home') // back label names the previous view
  })

  it('the back button pops to the root', async () => {
    const wrapper = mountStack()
    await wrapper.find('#go').trigger('click')
    await wrapper.find('[aria-label="Back"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Home')
    expect(wrapper.find('#go').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(false)
  })

  it('popToRoot unwinds a deep stack at once', async () => {
    const wrapper = mountStack()
    wrapper.vm.push({ title: 'A', content: () => h('p', 'a') })
    wrapper.vm.push({ title: 'B', content: () => h('p', 'b') })
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('B')
    expect(wrapper.find('[aria-label="Back"]').text()).toContain('A')

    wrapper.vm.popToRoot()
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Home')
  })

  it('pop on the root is a no-op', async () => {
    const wrapper = mountStack()
    wrapper.vm.pop()
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Home')
  })
})

describe('NavigationStack state preservation across pop', () => {
  // Local state that would be lost if the pane were remounted.
  const Counter = defineComponent({
    setup() {
      const count = ref(0)
      return () => h('button', { id: 'counter', onClick: () => count.value++ }, `count:${count.value}`)
    },
  })

  function mountStack() {
    return mount(NavigationStack, {
      props: { title: 'Home' },
      slots: { default: () => h(Counter) },
    })
  }

  it('the previous view keeps component state', async () => {
    const wrapper = mountStack()
    await wrapper.find('#counter').trigger('click')
    await wrapper.find('#counter').trigger('click')
    expect(wrapper.find('#counter').text()).toBe('count:2')

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()
    wrapper.vm.pop()
    await flushPromises()

    expect(wrapper.find('#counter').text()).toBe('count:2')
  })

  it('the previous pane keeps its scroll position', async () => {
    const wrapper = mountStack()
    const pane = wrapper.find('.nav-pane').element
    pane.scrollTop = 250

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()
    wrapper.vm.pop()
    await flushPromises()

    expect(wrapper.find('.nav-pane').element).toBe(pane) // never remounted
    expect(pane.scrollTop).toBe(250)
  })

  it('buried panes stay mounted but inert', async () => {
    const wrapper = mountStack()
    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()

    const panes = wrapper.findAll('.nav-pane')
    expect(panes).toHaveLength(2)
    expect(panes[0].attributes('inert')).toBeDefined()
    expect(panes[0].classes()).toContain('nav-pane--under')
    expect(panes[1].attributes('inert')).toBeUndefined()
  })

  it('state survives a deep push-pop round trip', async () => {
    const wrapper = mountStack()
    await wrapper.find('#counter').trigger('click')

    wrapper.vm.push({ title: 'A', content: () => h(Counter) })
    await flushPromises()
    const inner = wrapper.findAll('#counter')[1]
    await inner.trigger('click')
    await inner.trigger('click')
    await inner.trigger('click')
    expect(inner.text()).toBe('count:3')

    wrapper.vm.push({ title: 'B', content: () => h('p', 'b') })
    await flushPromises()
    wrapper.vm.pop() // back to A — its counter must still read 3
    await flushPromises()
    expect(wrapper.findAll('#counter')[1].text()).toBe('count:3')

    wrapper.vm.pop() // back to root
    await flushPromises()
    expect(wrapper.find('#counter').text()).toBe('count:1')
  })
})

describe('NavigationLink with a destination', () => {
  function mountWithLink() {
    return mount(NavigationStack, {
      props: { title: 'Home' },
      slots: {
        default: () => h(NavigationLink, { destinationTitle: 'Settings' }, {
          default: () => 'Open settings',
          destination: () => h('p', 'settings-content'),
        }),
      },
    })
  }

  it('clicking pushes the destination slot', async () => {
    const wrapper = mountWithLink()
    await wrapper.find('.nav-link').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('settings-content')
    expect(wrapper.find('h1').text()).toBe('Settings')
  })

  it('activates from the keyboard', async () => {
    const wrapper = mountWithLink()
    await wrapper.find('.nav-link').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.text()).toContain('settings-content')
  })

  it('is focusable and announced as a button', () => {
    const wrapper = mountWithLink()
    const link = wrapper.find('.nav-link')
    expect(link.attributes('role')).toBe('button')
    expect(link.attributes('tabindex')).toBe('0')
  })

  it('without a destination it stays a plain tappable row', async () => {
    const wrapper = mount(NavigationLink, { slots: { default: () => 'Row' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('tap')).toHaveLength(1)
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

describe('Sheet', () => {
  it('exposes an accessible dialog name', () => {
    const wrapper = mount(Sheet, {
      props: { isPresented: true, label: 'SwiftVue Demo' },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.getAttribute('aria-label')).toBe('SwiftVue Demo')
    wrapper.unmount()
  })
})

describe('NavigationStack browser history', () => {
  const Pusher = defineComponent({
    setup() {
      const nav = useNavigation()!
      return () => h('button', {
        id: 'go',
        onClick: () => nav.push({ title: 'Detail', content: () => h('p', 'detail') }),
      }, 'go')
    },
  })

  function mountStack(path: boolean) {
    return mount(NavigationStack, {
      props: { title: 'Home', path },
      slots: { default: () => h(Pusher) },
      attachTo: document.body,
    })
  }

  it('stays out of history unless asked', async () => {
    const push = vi.spyOn(history, 'pushState')
    const wrapper = mountStack(false)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.vm.depth).toBe(1)
    push.mockRestore()
    wrapper.unmount()
  })

  it('records the depth so Back has somewhere to return to', async () => {
    const push = vi.spyOn(history, 'pushState')
    const wrapper = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledOnce()
    expect(push.mock.calls[0][0]).toMatchObject({ 'swiftvue-nav-depth': 1 })
    push.mockRestore()
    wrapper.unmount()
  })

  it('the back button delegates to the browser rather than popping twice', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    const wrapper = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    wrapper.vm.pop()
    await flushPromises()
    expect(back).toHaveBeenCalledOnce()
    // the stack waits for popstate, so the browser stays the source of truth
    expect(wrapper.vm.depth).toBe(1)
    back.mockRestore()
    wrapper.unmount()
  })

  it('a browser Back pops the stack', async () => {
    const wrapper = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    expect(wrapper.vm.depth).toBe(1)

    window.dispatchEvent(new PopStateEvent('popstate', { state: { 'swiftvue-nav-depth': 0 } }))
    await flushPromises()
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })

  it('forward past views it no longer holds stops at what it has', async () => {
    const wrapper = mountStack(true)
    window.dispatchEvent(new PopStateEvent('popstate', { state: { 'swiftvue-nav-depth': 5 } }))
    await flushPromises()
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })

  it('stops listening once unmounted', async () => {
    const wrapper = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    wrapper.unmount()

    // no error, and nothing left listening to move a dead stack
    expect(() => window.dispatchEvent(
      new PopStateEvent('popstate', { state: { 'swiftvue-nav-depth': 0 } }),
    )).not.toThrow()
  })
})
