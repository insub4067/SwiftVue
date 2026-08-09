import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  // history.state is shared by the whole file, and every stack folds its key
  // into whatever is already there. Start each test from nothing so the key a
  // mount stamps is unambiguous. Ownership of history — one stack per page —
  // lives in review-round3.test.ts.
  beforeEach(() => history.replaceState(null, ''))

  const Pusher = defineComponent({
    setup() {
      const nav = useNavigation()!
      return () => h('button', {
        id: 'go',
        onClick: () => nav.push({ title: 'Detail', content: () => h('p', 'detail') }),
      }, 'go')
    },
  })

  // The history key is per stack so a tabbed app can give each tab its own
  // history, so a test cannot hard-code it — it reads the key back off the
  // replaceState the stack makes when it mounts.
  function mountStack(browserBack: boolean) {
    const replace = vi.spyOn(history, 'replaceState')
    const wrapper = mount(NavigationStack, {
      props: { title: 'Home', browserBack },
      slots: { default: () => h(Pusher) },
      attachTo: document.body,
    })
    const stamped = replace.mock.calls[0]?.[0] as Record<string, number> | undefined
    replace.mockRestore()
    const key = stamped ? Object.keys(stamped).filter(k => k.startsWith('swiftvue-nav')).at(-1)! : ''

    const goTo = async (depth: number) => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { [key]: depth } }))
      await flushPromises()
    }
    return { wrapper, key, goTo }
  }

  it('stays out of history unless asked', async () => {
    const push = vi.spyOn(history, 'pushState')
    const { wrapper } = mountStack(false)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.vm.depth).toBe(1)
    push.mockRestore()
    wrapper.unmount()
  })

  it('records the depth so Back has somewhere to return to', async () => {
    const push = vi.spyOn(history, 'pushState')
    const { wrapper, key } = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    expect(push).toHaveBeenCalledOnce()
    expect(push.mock.calls[0][0]).toMatchObject({ [key]: 1 })
    push.mockRestore()
    wrapper.unmount()
  })

  it('the back button delegates to the browser rather than popping twice', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    const { wrapper } = mountStack(true)
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
    const { wrapper, goTo } = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    expect(wrapper.vm.depth).toBe(1)

    await goTo(0)
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })

  it('forward past views it no longer holds stops at what it has', async () => {
    const { wrapper, goTo } = mountStack(true)
    await goTo(5)
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })

  // Back has to leave the entry behind, or Forward has nothing to return to.
  it('Forward returns to a screen Back left', async () => {
    const { wrapper, goTo } = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    await goTo(0)
    expect(wrapper.vm.depth).toBe(0)
    expect(wrapper.text()).not.toContain('detail')

    await goTo(1)
    expect(wrapper.vm.depth).toBe(1)
    expect(wrapper.text(), 'the screen is rebuilt from its closure').toContain('detail')
    wrapper.unmount()
  })

  // pushState drops the browser's forward entries; ours have to go with them.
  it('a push after Back makes the forward screen unreachable', async () => {
    const { wrapper, goTo } = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    await goTo(0)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    expect(wrapper.vm.depth).toBe(1)

    await goTo(2)
    expect(wrapper.vm.depth, 'nothing was forked forward to').toBe(1)
    wrapper.unmount()
  })

  // Without history there is no Forward, so a popped screen must not linger.
  it('drops the popped entry when the browser is not driving', async () => {
    const { wrapper } = mountStack(false)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    wrapper.vm.pop()
    await flushPromises()

    expect(wrapper.vm.depth).toBe(0)
    expect(wrapper.text()).not.toContain('detail')
    wrapper.unmount()
  })

  it('stops listening once unmounted', async () => {
    const { wrapper, key } = mountStack(true)
    await wrapper.find('#go').trigger('click')
    await flushPromises()
    wrapper.unmount()

    // no error, and nothing left listening to move a dead stack
    expect(() => window.dispatchEvent(
      new PopStateEvent('popstate', { state: { [key]: 0 } }),
    )).not.toThrow()
  })
})

describe('NavigationStack deep links', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/')
  })

  const Rows = defineComponent({
    setup: () => () => [
      h(NavigationLink, { route: 'general', destinationTitle: 'General' }, {
        default: () => 'General',
        destination: () => h(NavigationLink, { route: 'sound', destinationTitle: 'Sound' }, {
          default: () => 'Sound',
          destination: () => h('p', 'sound-screen'),
        }),
      }),
      h(NavigationLink, { route: 'user', param: '42', destinationTitle: 'Ada' }, {
        default: () => 'Ada',
        destination: () => h('p', 'user-42'),
      }),
      h(NavigationLink, { route: 'user', param: '7', destinationTitle: 'Grace' }, {
        default: () => 'Grace',
        destination: () => h('p', 'user-7'),
      }),
    ],
  })

  const mountStack = () => mount(NavigationStack, {
    props: { title: 'Settings', browserBack: true, historyKey: 'nav' },
    slots: { default: () => h(Rows) },
    attachTo: document.body,
  })

  const search = () => new URL(location.href).searchParams.get('nav')

  it('a named push names the URL', async () => {
    const wrapper = mountStack()
    await wrapper.findAll('.nav-link')[0].trigger('click')
    await flushPromises()

    expect(search()).toBe('general')
    expect(wrapper.find('h1').text()).toBe('General')
    wrapper.unmount()
  })

  it('the param travels in the URL and picks the right row', async () => {
    const wrapper = mountStack()
    await wrapper.findAll('.nav-link')[2].trigger('click')
    await flushPromises()

    expect(search()).toBe('user~7')
    expect(wrapper.text()).toContain('user-7')
    wrapper.unmount()
  })

  // The whole point: a reload is a fresh mount with only the URL to go on.
  it('reopens a screen from a link someone else shared', async () => {
    history.replaceState(null, '', '/?nav=user~42')
    const wrapper = mountStack()
    await flushPromises()

    expect(wrapper.vm.depth).toBe(1)
    expect(wrapper.text(), 'the row the param names, not the last one').toContain('user-42')
    wrapper.unmount()
  })

  // Level 2's link only exists once level 1 is back, so the restore has to
  // wait for it rather than give up on the first miss.
  it('restores a screen whose link only appears once its parent is back', async () => {
    history.replaceState(null, '', '/?nav=general/sound')
    const wrapper = mountStack()
    await flushPromises()
    await flushPromises()

    expect(wrapper.vm.depth).toBe(2)
    expect(wrapper.text()).toContain('sound-screen')
    expect(wrapper.find('h1').text()).toBe('Sound')
    wrapper.unmount()
  })

  it('stops at the last screen it can name', async () => {
    history.replaceState(null, '', '/?nav=general/nowhere')
    const wrapper = mountStack()
    await flushPromises()
    await flushPromises()

    expect(wrapper.vm.depth, 'general came back, nowhere could not').toBe(1)
    wrapper.unmount()
  })

  // Restoring is where the user already is, so it must not add a history
  // entry — otherwise Back would return them to the same screen.
  it('a restore replaces the entry rather than pushing one', async () => {
    history.replaceState(null, '', '/?nav=general')
    const push = vi.spyOn(history, 'pushState')
    const wrapper = mountStack()
    await flushPromises()

    expect(wrapper.vm.depth).toBe(1)
    expect(push).not.toHaveBeenCalled()
    push.mockRestore()
    wrapper.unmount()
  })

  it('popping takes the screen back out of the URL', async () => {
    const wrapper = mountStack()
    await wrapper.findAll('.nav-link')[0].trigger('click')
    await flushPromises()
    expect(search()).toBe('general')

    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
    await flushPromises()
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })

  // An unnamed screen cannot be described, so the URL says where the naming
  // stopped instead of claiming the user is somewhere they are not.
  it('the URL stops at the last named screen', async () => {
    const wrapper = mountStack()
    await wrapper.findAll('.nav-link')[0].trigger('click')
    await flushPromises()

    wrapper.vm.push({ title: 'Ad hoc', content: () => h('p', 'closure') })
    await flushPromises()
    expect(wrapper.vm.depth).toBe(2)
    expect(search(), 'named prefix only').toBe('general')

    // A named screen above an unnamed one cannot be reached by replaying the
    // URL, so skipping the gap would describe a stack that never existed.
    wrapper.vm.pushRoute('user', '42')
    await flushPromises()
    expect(wrapper.vm.depth).toBe(3)
    expect(search(), 'the gap ends the link, it does not close up').toBe('general')
    wrapper.unmount()
  })

  it('a stack without a historyKey leaves the URL alone', async () => {
    const wrapper = mount(NavigationStack, {
      props: { title: 'Settings', browserBack: true },
      slots: { default: () => h(Rows) },
      attachTo: document.body,
    })
    await wrapper.findAll('.nav-link')[0].trigger('click')
    await flushPromises()

    expect(wrapper.vm.depth).toBe(1)
    expect(location.search).toBe('')
    wrapper.unmount()
  })
})
