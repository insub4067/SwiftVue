import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import Menu from '../../src/components/controls/Menu.vue'
import ContextMenu from '../../src/components/controls/ContextMenu.vue'
import Gauge from '../../src/components/feedback/Gauge.vue'
import { parseRoutes, serializeRoute, useNavigation } from '../../src/composables/useNavigation'

// Browser history is one linear list. Two stacks pushing into it interleave,
// and `history.back()` cannot reach into the middle to remove an entry — so
// at most one mounted stack can answer the back button.
describe('one history owner per page', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  const Pusher = defineComponent({
    setup() {
      const nav = useNavigation()!
      return () => h('button', {
        class: 'go',
        onClick: () => nav.push({ title: 'Detail', content: () => h('p', 'detail') }),
      }, 'go')
    },
  })

  const TwoStacks = defineComponent({
    setup: () => () => [
      h(NavigationStack, { title: 'A', browserBack: true }, { default: () => h(Pusher) }),
      h(NavigationStack, { title: 'B', browserBack: true }, { default: () => h(Pusher) }),
    ],
  })

  it('a second stack does not touch history', async () => {
    const wrapper = mount(TwoStacks, { attachTo: document.body })
    const push = vi.spyOn(history, 'pushState')

    await wrapper.findAll('.go')[0].trigger('click')
    await wrapper.findAll('.go')[1].trigger('click')
    await nextTick()

    expect(push, 'only the owner records anything').toHaveBeenCalledOnce()
    push.mockRestore()
    wrapper.unmount()
  })

  // The reported failure: A's back button popped B, because history.back()
  // undoes the most recent entry no matter who pushed it.
  it('a stack pops itself, never its neighbour', async () => {
    const back = vi.spyOn(history, 'back').mockImplementation(() => {})
    const wrapper = mount(TwoStacks, { attachTo: document.body })
    const [a, b] = wrapper.findAllComponents(NavigationStack)

    await wrapper.findAll('.go')[0].trigger('click')
    await wrapper.findAll('.go')[1].trigger('click')
    await nextTick()
    expect(a.vm.depth).toBe(1)
    expect(b.vm.depth).toBe(1)

    b.vm.pop()
    await nextTick()
    expect(b.vm.depth, 'B pops itself').toBe(0)
    expect(a.vm.depth, 'A is untouched').toBe(1)
    expect(back, 'a non-owner must not drive the browser').not.toHaveBeenCalled()

    back.mockRestore()
    wrapper.unmount()
  })

  it('ownership passes on when the owner unmounts', async () => {
    const first = mount(NavigationStack, { props: { title: 'A', browserBack: true } })
    first.unmount()

    const push = vi.spyOn(history, 'pushState')
    const second = mount(NavigationStack, { props: { title: 'B', browserBack: true } })
    second.vm.push({ title: 'Detail', content: () => h('p', 'd') })
    await nextTick()

    expect(push, 'the seat was released').toHaveBeenCalledOnce()
    push.mockRestore()
    second.unmount()
  })
})

describe('route serialization is URL-safe', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  // A hand-typed or truncated link must not take the app down with it.
  it.each(['%', 'a/%zz', '%E0%A4%A', 'ok/%'])('survives the malformed link %s', (value) => {
    expect(() => parseRoutes(value)).not.toThrow()
  })

  it('keeps whatever prefix it could read', () => {
    expect(parseRoutes('general/%')).toEqual([{ id: 'general' }])
  })

  // `~` separates id from param, and encodeURIComponent leaves it alone, so
  // an id containing one used to split into the wrong route.
  it('a tilde in an id survives the round trip', () => {
    const route = { id: 'user~archive' }
    expect(parseRoutes(serializeRoute(route))).toEqual([route])
  })

  it('a tilde in a param survives too', () => {
    const route = { id: 'user', param: 'a~b' }
    expect(parseRoutes(serializeRoute(route))).toEqual([route])
  })

  it('a slash in a param does not split the path', () => {
    const route = { id: 'file', param: 'a/b' }
    expect(parseRoutes(serializeRoute(route))).toEqual([route])
  })

  it('a bad link does not stop the stack from mounting', async () => {
    history.replaceState(null, '', '/?nav=%')
    const wrapper = mount(NavigationStack, {
      props: { title: 'Home', browserBack: true, historyKey: 'nav' },
      slots: { default: () => h(NavigationLink, { route: 'a' }, { destination: () => h('p', 'a') }) },
    })
    await nextTick()
    expect(wrapper.vm.depth).toBe(0)
    wrapper.unmount()
  })
})

// history.state belongs to the host application. A component that writes a
// bare key into it can quietly overwrite the router's own bookkeeping.
describe('history.state stays namespaced', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  it('leaves a host key of the same name alone', async () => {
    history.replaceState({ settings: { scrollTop: 400 } }, '', '/')
    const wrapper = mount(NavigationStack, {
      props: { title: 'Settings', browserBack: true, historyKey: 'settings' },
    })
    await nextTick()

    expect(history.state.settings, 'the host owns this key').toEqual({ scrollTop: 400 })
    expect(Object.keys(history.state).some(k => k.startsWith('swiftvue-nav')), 'ours is namespaced').toBe(true)
    wrapper.unmount()
  })
})

describe('ContextMenu long press', () => {
  const actions = [{ label: 'Copy', id: 'copy' }]

  it('does not let the press through as a click on the content', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const onTap = vi.fn()
    const wrapper = mount(ContextMenu, {
      props: { actions },
      slots: { default: () => h('button', { class: 'inner', onClick: onTap }, 'Open') },
      attachTo: document.body,
    })

    const inner = wrapper.find('.inner')
    await inner.trigger('pointerdown', { pointerType: 'touch', clientX: 5, clientY: 5 })
    vi.advanceTimersByTime(600)
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    // the browser fires click after the press ends, on the element under it
    await inner.trigger('pointerup', { pointerType: 'touch' })
    await inner.trigger('click')
    expect(onTap, 'the menu opened instead of the button firing').not.toHaveBeenCalled()

    vi.useRealTimers()
    wrapper.unmount()
  })

  // Lift a finger past the edge of the target and the element never sees
  // pointerup, so the timer used to keep running and open a stray menu.
  it('a press that ends outside the target cancels', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = mount(ContextMenu, {
      props: { actions },
      slots: { default: '<p class="row">Row</p>' },
      attachTo: document.body,
    })

    await wrapper.trigger('pointerdown', { pointerType: 'touch', clientX: 5, clientY: 5 })
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    vi.useRealTimers()
    wrapper.unmount()
  })
})

// Escape has to reach whatever actually holds focus. Dispatching straight at
// the menu element proves nothing when focus never went there.
describe('Escape from a menu with nothing to focus', () => {
  const press = (key: string) =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))

  it.each([
    ['no actions', []],
    ['every action disabled', [{ label: 'Copy', disabled: true }]],
  ])('Menu with %s closes on Escape', async (_case, actions) => {
    const wrapper = mount(Menu, { props: { label: 'More', actions }, attachTo: document.body })
    await wrapper.find('.menu-trigger').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    press('Escape')
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each([
    ['no actions', []],
    ['every action disabled', [{ label: 'Copy', disabled: true }]],
  ])('ContextMenu with %s closes on Escape', async (_case, actions) => {
    const wrapper = mount(ContextMenu, {
      props: { label: 'Row', actions },
      slots: { default: '<p>Row</p>' },
      attachTo: document.body,
    })
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    press('Escape')
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })
})

// https://www.w3.org/TR/wai-aria/#meter — a meter needs an accessible name,
// and aria-valuenow must sit inside [aria-valuemin, aria-valuemax].
describe('Gauge meets the meter contract', () => {
  it.each([
    ['above the range', 200, '100'],
    ['below the range', -20, '0'],
  ])('clamps aria-valuenow %s', (_case, value, expected) => {
    const wrapper = mount(Gauge, { props: { value, min: 0, max: 100, label: 'Battery' } })
    expect(wrapper.attributes('aria-valuenow')).toBe(expected)
  })

  it('still reports the real reading, in the place meant for text', () => {
    const wrapper = mount(Gauge, { props: { value: 200, min: 0, max: 100, label: 'Battery' } })
    expect(wrapper.attributes('aria-valuetext')).toContain('200')
  })

  it('warns when a meter would have no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Gauge, { props: { value: 0.5 } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Gauge'))
    warn.mockRestore()
  })

  it('says nothing when it has one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mount(Gauge, { props: { value: 0.5, label: 'Signal' } })
    mount(Gauge, { props: { value: 0.5 }, attrs: { 'aria-label': 'Signal' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
