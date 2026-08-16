import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import NavigationBackButton from '../../src/components/navigation/NavigationBackButton.vue'
import TabView from '../../src/components/navigation/TabView.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'
import { useNavigation } from '../../src/composables/useNavigation'
import { onAppear, onDisappear } from '../../src/composables/useLifecycle'

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

describe('NavigationBackButton', () => {
  it('is visible by default and emits back when clicked', async () => {
    const wrapper = mount(NavigationBackButton)

    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(true)
    await wrapper.trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('renders no button when visible is false', () => {
    const wrapper = mount(NavigationBackButton, { props: { visible: false } })
    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(false)
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

  function mountStack(props: { backButtonVisible?: boolean } = {}) {
    return mount(NavigationStack, {
      props: { title: 'Home', ...props },
      slots: { default: () => h(Pusher) },
    })
  }

  it('push shows the destination with its title and a circular back button', async () => {
    const wrapper = mountStack()
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('detail-content')
    expect(wrapper.find('h1').text()).toBe('Detail')

    const back = wrapper.find('[aria-label="Back"]')
    expect(back.exists()).toBe(true)
    expect(back.classes()).toContain('swift-navigation-back-button')
    expect(back.text()).toBe('')
  })

  it('hides only the back button when backButtonVisible is false', async () => {
    const wrapper = mountStack({ backButtonVisible: false })
    await wrapper.find('#go').trigger('click')
    await flushPromises()

    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(false)
    expect(wrapper.find('h1').text()).toBe('Detail')
    expect(wrapper.text()).toContain('detail-content')

    wrapper.vm.pop()
    await flushPromises()
    expect(wrapper.find('h1').text()).toBe('Home')
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
    expect(wrapper.find('[aria-label="Back"]').exists()).toBe(true)

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

  // Most projects have no vue-router, and writing `<router-link>` in the
  // template makes its lookup run at the top of every render regardless of
  // the `v-if` guarding it. The result was a warning per link per render in
  // a project that never asked for a router — silent to the tests that only
  // checked the markup, deafening in a console.
  it('says nothing about vue-router when no link asked for it', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(NavigationLink, { slots: { default: () => 'Row' } })
    const said = warn.mock.calls.flat().join('\n')
    warn.mockRestore()
    expect(said).toBe('')
  })

  it('but a link with `to` still renders the router link', () => {
    const RouterLink = defineComponent({
      props: { to: { type: String, required: true } },
      setup: (props, { slots }) => () => h('a', { href: props.to, class: 'stub-router' }, slots.default?.()),
    })
    const wrapper = mount(NavigationLink, {
      props: { to: '/somewhere' },
      slots: { default: () => 'Row' },
      global: { components: { RouterLink } },
    })
    expect(wrapper.find('.stub-router').exists()).toBe(true)
    expect(wrapper.find('.stub-router').attributes('href')).toBe('/somewhere')
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

  it('lets a tab draw its own icon through a `<id>-icon` slot', () => {
    const wrapper = mount(TabView, {
      props: { tabs, modelValue: 'settings' },
      slots: {
        'settings-icon': `<template #settings-icon="{ active }">
          <svg class="gear" :data-active="active" />
        </template>`,
      },
    })
    const settings = wrapper.findAll('[role="tab"]')[1]
    // The custom mark replaces the glyph, and the slot is told the tab is active.
    expect(settings.find('svg.gear').exists()).toBe(true)
    expect(settings.find('svg.gear').attributes('data-active')).toBe('true')
    // The tab without a slot still renders its glyph.
    expect(wrapper.findAll('[role="tab"]')[0].find('.tab-icon').text()).toBe('🏠')
  })
})

// SwiftUI builds a tab the first time it is opened and keeps it from then
// on, so a tab you come back to is the one you left. Rendering only the
// selected tab threw that away on every switch — a Settings screen three
// pushes deep was back at its root the moment you glanced at another tab.
describe('a tab you come back to is the one you left', () => {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'settings', label: 'Settings' },
  ]

  /** A screen whose state is visible, so reuse can be told from remounting. */
  const Screen = defineComponent({
    props: { name: { type: String, required: true } },
    setup(props) {
      const typed = ref('')
      mounts[props.name] = (mounts[props.name] ?? 0) + 1
      return () => h('input', {
        class: `field-${props.name}`,
        value: typed.value,
        onInput: (e: Event) => (typed.value = (e.target as HTMLInputElement).value),
      })
    },
  })
  let mounts: Record<string, number> = {}

  function mountTabs() {
    return mount(TabView, {
      props: { tabs, modelValue: 'home' },
      slots: {
        home: () => h(Screen, { name: 'home' }),
        settings: () => h(Screen, { name: 'settings' }),
      },
    })
  }

  beforeEach(() => { mounts = {} })

  it('keeps what was typed in a tab across a switch away and back', async () => {
    const wrapper = mountTabs()

    const field = wrapper.find('.field-home')
    ;(field.element as HTMLInputElement).value = 'half a sentence'
    await field.trigger('input')

    await wrapper.setProps({ modelValue: 'settings' })
    await wrapper.setProps({ modelValue: 'home' })

    expect((wrapper.find('.field-home').element as HTMLInputElement).value)
      .toBe('half a sentence')
    expect(mounts.home, 'it was never rebuilt').toBe(1)
  })

  it('does not build a tab nobody has opened', () => {
    mountTabs()
    expect(mounts.home).toBe(1)
    expect(mounts.settings, 'an unopened tab costs nothing').toBeUndefined()
  })

  it('builds a tab on its first selection, once', async () => {
    const wrapper = mountTabs()
    await wrapper.setProps({ modelValue: 'settings' })
    expect(mounts.settings).toBe(1)

    await wrapper.setProps({ modelValue: 'home' })
    await wrapper.setProps({ modelValue: 'settings' })
    expect(mounts.settings, 'kept, not rebuilt').toBe(1)
  })

  // A kept pane is still in the DOM, so hiding it has to be the kind of
  // hiding assistive technology respects — display:none, not opacity.
  it('an unselected tab is out of the accessibility tree', async () => {
    const wrapper = mountTabs()
    await wrapper.setProps({ modelValue: 'settings' })

    const panels = wrapper.findAll('[role="tabpanel"]')
    expect(panels).toHaveLength(2)
    const hidden = panels.find(p => p.attributes('aria-labelledby') === 'tab-home')!
    expect((hidden.element as HTMLElement).style.display).toBe('none')
  })

  it('a tab removed from the bar takes its pane with it', async () => {
    const wrapper = mountTabs()
    await wrapper.setProps({ modelValue: 'settings' })
    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(2)

    await wrapper.setProps({ tabs: [tabs[1]], modelValue: 'settings' })
    expect(wrapper.findAll('[role="tabpanel"]'), 'home is gone, not merely hidden').toHaveLength(1)
  })

  // The point of keeping a pane alive is that it is not on screen, and a
  // view that is not on screen has disappeared — the same rule a covered
  // NavigationStack pane follows.
  it('onAppear and onDisappear follow the selection', async () => {
    const log: string[] = []
    const Watched = defineComponent({
      setup() {
        onAppear(() => log.push('appear'))
        onDisappear(() => log.push('disappear'))
        return () => h('p', 'watched')
      },
    })
    const wrapper = mount(TabView, {
      props: { tabs, modelValue: 'home' },
      slots: { home: () => h(Watched), settings: () => h('p', 'other') },
    })

    expect(log).toEqual(['appear'])
    await wrapper.setProps({ modelValue: 'settings' })
    expect(log).toEqual(['appear', 'disappear'])
    await wrapper.setProps({ modelValue: 'home' })
    expect(log).toEqual(['appear', 'disappear', 'appear'])
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
