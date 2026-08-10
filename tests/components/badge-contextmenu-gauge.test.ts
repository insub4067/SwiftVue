import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TabView from '../../src/components/navigation/TabView.vue'
import ContextMenu from '../../src/components/controls/ContextMenu.vue'
import Gauge from '../../src/components/feedback/Gauge.vue'

describe('TabView badge', () => {
  const mountTabs = (badge?: number | string) => mount(TabView, {
    props: { tabs: [{ id: 'inbox', label: 'Inbox', icon: '📥', badge }], modelValue: 'inbox' },
  })

  it('shows the count on the tab', () => {
    expect(mountTabs(3).find('.tab-badge').text()).toBe('3')
  })

  // iOS draws nothing for these rather than an empty red dot.
  it.each([[0], [''], [undefined]])('%s shows no badge', (badge) => {
    expect(mountTabs(badge as number | string | undefined).find('.tab-badge').exists()).toBe(false)
  })

  it('caps the display but still reads the real number out', () => {
    const badge = mountTabs(140).find('.tab-badge')
    expect(badge.text()).toBe('99+')
    expect(badge.attributes('aria-label'), 'the capped text loses the count').toBe('140')
  })

  it('leaves an uncapped badge to speak for itself', () => {
    expect(mountTabs(9).find('.tab-badge').attributes('aria-label')).toBeUndefined()
  })

  it('a string badge passes through untouched', () => {
    expect(mountTabs('NEW').find('.tab-badge').text()).toBe('NEW')
  })

  it('the count reaches the tab button’s name', () => {
    expect(mountTabs(3).find('[role="tab"]').text()).toContain('3')
  })
})

describe('ContextMenu', () => {
  const actions = [
    { label: 'Copy', id: 'copy' },
    { label: 'Share', id: 'share', disabled: true },
    { label: 'Delete', id: 'del', role: 'destructive' as const },
  ]
  const mountMenu = (props: Record<string, unknown> = {}) => mount(ContextMenu, {
    props: { actions, label: 'Row actions', ...props },
    slots: { default: '<p class="row">Long press me</p>' },
    attachTo: document.body,
  })

  it('stays closed until asked', () => {
    const wrapper = mountMenu()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  // The wrapper carries no role, on purpose: it wraps arbitrary content,
  // often a Button or a NavigationLink, and a widget role over an
  // interactive element flattens the inner control out of reach. It says
  // "I open a menu" with aria-haspopup, which is valid without a role;
  // aria-expanded, which needs a role, is not set at all.
  it('announces a popup without claiming a widget role', () => {
    const wrapper = mountMenu()
    expect(wrapper.attributes('role'), 'no role over arbitrary content').toBeUndefined()
    expect(wrapper.attributes('aria-haspopup')).toBe('menu')
    expect(wrapper.attributes('aria-expanded'), 'invalid without a role').toBeUndefined()
  })

  // The standard context-menu keys, which need no role on the wrapper.
  it.each(['ContextMenu'])('%s opens it', async (key) => {
    const wrapper = mountMenu()
    await wrapper.trigger('keydown', { key })
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('Shift+F10 opens it', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('keydown', { key: 'F10', shiftKey: true })
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  // A Button in the slot keeps its own Enter — the wrapper claims no key
  // that would compete with it, which is the whole reason it claims no role.
  it('leaves a control inside the slot fully operable', async () => {
    let inner = 0
    const wrapper = mount(ContextMenu, {
      props: { actions, label: 'Row actions' },
      slots: { default: `<button type="button" class="inner" onclick="">Open</button>` },
      attachTo: document.body,
    })
    wrapper.find('.inner').element.addEventListener('click', () => { inner++ })
    await wrapper.find('.inner').trigger('keydown', { key: 'Enter' })
    await wrapper.find('.inner').trigger('click')
    expect(wrapper.find('[role="menu"]').exists(), 'the wrapper did not hijack it').toBe(false)
    expect(inner, 'the inner button still fired').toBe(1)
    wrapper.unmount()
  })

  it('a right click opens it where the pointer is', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 40, clientY: 60 })
    const menu = wrapper.find('[role="menu"]')
    expect(menu.exists()).toBe(true)
    expect(menu.attributes('style')).toContain('left: 40px')
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(3)
    wrapper.unmount()
  })

  // The browser's own menu would cover ours.
  it('replaces the browser menu rather than stacking under it', async () => {
    const wrapper = mountMenu()
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('a held touch opens it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = mountMenu()
    await wrapper.trigger('pointerdown', { pointerType: 'touch', clientX: 10, clientY: 10 })
    expect(wrapper.find('[role="menu"]').exists(), 'not yet').toBe(false)

    vi.advanceTimersByTime(500)
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    vi.useRealTimers()
    wrapper.unmount()
  })

  // A press that travels is a scroll. Opening a menu mid-scroll would both
  // interrupt the scroll and land on whatever slid under the finger.
  it('a touch that moves is a scroll, not a long press', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = mountMenu()
    await wrapper.trigger('pointerdown', { pointerType: 'touch', clientX: 10, clientY: 10 })
    await wrapper.trigger('pointermove', { clientX: 10, clientY: 60 })

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('a mouse press does not arm the long press', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    const wrapper = mountMenu()
    await wrapper.trigger('pointerdown', { pointerType: 'mouse', clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('Shift+F10 opens it without a pointer', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('keydown', { key: 'F10', shiftKey: true })
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('choosing an action reports it and closes', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    await wrapper.findAll('[role="menuitem"]')[0].trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual([actions[0]])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a disabled action cannot be chosen', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    await wrapper.findAll('[role="menuitem"]')[1].trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })

  it('arrow keys roll through the enabled items', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    await nextTick()
    const enabled = wrapper.findAll('[role="menuitem"]:not([disabled])')
    expect(document.activeElement).toBe(enabled[0].element)

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(enabled[1].element)
    wrapper.unmount()
  })

  it('Escape closes it', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a press outside closes it', async () => {
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('disabled leaves the browser menu alone and stays out of the tab order', async () => {
    const wrapper = mountMenu({ disabled: true })
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    wrapper.element.dispatchEvent(event)
    await nextTick()

    expect(event.defaultPrevented).toBe(false)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.attributes('tabindex')).toBeUndefined()
    wrapper.unmount()
  })

  it('stops listening to the document once unmounted', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = mountMenu()
    await wrapper.trigger('contextmenu', { clientX: 0, clientY: 0 })
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    remove.mockRestore()
  })
})

describe('Gauge', () => {
  const linear = (props: Record<string, unknown>) =>
    mount(Gauge, { props: { gaugeStyle: 'linear', label: 'Meter', ...props } })

  it('fills to the fraction of its range', () => {
    expect(linear({ value: 25, min: 0, max: 100 }).find('.gauge-bar-fill').attributes('style'))
      .toContain('width: 25%')
  })

  it('a range that does not start at zero still reads correctly', () => {
    expect(linear({ value: 30, min: 20, max: 40 }).find('.gauge-bar-fill').attributes('style'))
      .toContain('width: 50%')
  })

  it.each([
    ['above the range', { value: 200, min: 0, max: 100 }, 'width: 100%'],
    ['below the range', { value: -5, min: 0, max: 100 }, 'width: 0%'],
    ['an empty range', { value: 5, min: 10, max: 10 }, 'width: 0%'],
    ['an inverted range', { value: 5, min: 10, max: 0 }, 'width: 0%'],
  ])('clamps %s', (_case, props, expected) => {
    expect(linear(props).find('.gauge-bar-fill').attributes('style')).toContain(expected)
  })

  it('announces itself as a meter over its range', () => {
    const wrapper = linear({ value: 40, min: 0, max: 100, label: 'Battery' })
    expect(wrapper.attributes('role')).toBe('meter')
    expect(wrapper.attributes('aria-valuenow')).toBe('40')
    expect(wrapper.attributes('aria-valuemin')).toBe('0')
    expect(wrapper.attributes('aria-valuemax')).toBe('100')
    expect(wrapper.attributes('aria-label')).toBe('Battery')
  })

  it('a custom readout is what gets announced', () => {
    const wrapper = linear({ value: 0.72, currentValueLabel: '72%' })
    expect(wrapper.attributes('aria-valuetext')).toBe('72%')
    expect(wrapper.text()).toContain('72%')
  })

  it('shows the end captions when given them', () => {
    const wrapper = linear({ value: 0.5, minimumValueLabel: '0', maximumValueLabel: 'Full' })
    expect(wrapper.find('.gauge-ends').text()).toContain('Full')
  })

  it('leaves the captions out when not', () => {
    expect(linear({ value: 0.5 }).find('.gauge-ends').exists()).toBe(false)
  })

  describe('circular', () => {
    const dial = (props: Record<string, unknown>) => mount(Gauge, { props: { label: 'Meter', ...props } })

    it('sweeps the arc in proportion to the value', () => {
      const empty = dial({ value: 0 }).find('.gauge-fill').attributes('stroke-dasharray')
      const half = dial({ value: 0.5 }).find('.gauge-fill').attributes('stroke-dasharray')
      const full = dial({ value: 1 }).find('.gauge-fill').attributes('stroke-dasharray')

      const len = (d?: string) => Number(d!.split(' ')[0])
      expect(len(empty)).toBe(0)
      expect(len(half)).toBeCloseTo(len(full) / 2, 5)
      expect(len(full)).toBeGreaterThan(0)
    })

    // An open dial has to stop short of a full circle, or full and empty look
    // the same and it reads as a progress ring.
    it('leaves the dial open at the bottom', () => {
      const full = dial({ value: 1 }).find('.gauge-fill').attributes('stroke-dasharray')!
      const [drawn, circumference] = full.split(' ').map(Number)
      expect(drawn).toBeLessThan(circumference)
      expect(drawn / circumference).toBeCloseTo(270 / 360, 5)
    })

    it('prints the value in the middle', () => {
      expect(dial({ value: 42, min: 0, max: 100 }).find('.gauge-readout').text()).toBe('42')
    })

    it('the label names it for assistive tech and on screen', () => {
      const wrapper = dial({ value: 0.5, label: 'Signal' })
      expect(wrapper.attributes('aria-label')).toBe('Signal')
      expect(wrapper.find('.gauge-label').text()).toBe('Signal')
    })
  })
})
