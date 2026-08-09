import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import TextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import SwipeActions from '../../src/components/data/SwipeActions.vue'
import { onSubmit } from '../../src/composables/useSubmit'
import { useSwipe } from '../../src/composables/useSwipe'

describe('onSubmit', () => {
  const screen = (handler: () => void, extra?: () => void) => defineComponent({
    setup() {
      onSubmit(handler)
      if (extra) onSubmit(extra)
      return () => h('div', [h(TextField), h(SecureField)])
    },
  })

  const enter = (w: ReturnType<typeof mount>, selector = 'input') =>
    w.find(selector).trigger('keydown', { key: 'Enter' })

  it('Return in a descendant field runs the handler', async () => {
    const handler = vi.fn()
    const wrapper = mount(screen(handler))
    await enter(wrapper)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('reaches fields nested any distance below', async () => {
    const handler = vi.fn()
    const Deep = defineComponent({ setup: () => () => h('div', [h('div', [h(TextField)])]) })
    const wrapper = mount(defineComponent({
      setup() {
        onSubmit(handler)
        return () => h(Deep)
      },
    }))
    await enter(wrapper)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('a password field submits too', async () => {
    const handler = vi.fn()
    const wrapper = mount(screen(handler))
    await wrapper.find('input[type="password"]').trigger('keydown', { key: 'Enter' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('any other key is not a submission', async () => {
    const handler = vi.fn()
    const wrapper = mount(screen(handler))
    await wrapper.find('input').trigger('keydown', { key: 'a' })
    expect(handler).not.toHaveBeenCalled()
  })

  // SwiftUI runs submit actions from the innermost outward.
  it('nested handlers both run, innermost first', async () => {
    const order: string[] = []
    const Inner = defineComponent({
      setup() {
        onSubmit(() => order.push('inner'))
        return () => h(TextField)
      },
    })
    const wrapper = mount(defineComponent({
      setup() {
        onSubmit(() => order.push('outer'))
        return () => h(Inner)
      },
    }))
    await enter(wrapper)
    expect(order).toEqual(['inner', 'outer'])
  })

  it('the field keeps its own @submit as well', async () => {
    const handler = vi.fn()
    const wrapper = mount(TextField)
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(handler).not.toHaveBeenCalled()
  })

  it('a field with nothing listening does not throw', async () => {
    const wrapper = mount(TextField)
    await expect(wrapper.trigger('keydown', { key: 'Enter' })).resolves.not.toThrow()
  })
})

describe('useSwipe', () => {
  const Swipeable = (options: Record<string, unknown>) => defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null)
      useSwipe(el, options)
      return () => h('div', { ref: el, class: 'target' }, 'swipe me')
    },
  })

  const gesture = async (
    wrapper: ReturnType<typeof mount>,
    from: [number, number],
    to: [number, number],
  ) => {
    await nextTick() // the listener binds after the DOM is patched
    const el = wrapper.find('.target').element
    const at = (x: number, y: number, type: string) =>
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }))
    at(from[0], from[1], 'pointerdown')
    at(to[0], to[1], 'pointermove')
    at(to[0], to[1], 'pointerup')
    await wrapper.vm.$nextTick()
  }

  it.each([
    ['left', [200, 50], [80, 50]],
    ['right', [80, 50], [200, 50]],
    ['up', [50, 200], [50, 80]],
    ['down', [50, 80], [50, 200]],
  ])('reports a swipe %s', async (direction, from, to) => {
    const onSwipe = vi.fn()
    const wrapper = mount(Swipeable({ onSwipe }))
    await gesture(wrapper, from as [number, number], to as [number, number])

    expect(onSwipe).toHaveBeenCalledOnce()
    expect(onSwipe.mock.calls[0][0].direction).toBe(direction)
  })

  it('calls the handler for that one direction', async () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const wrapper = mount(Swipeable({ onSwipeLeft, onSwipeRight }))
    await gesture(wrapper, [200, 50], [80, 50])

    expect(onSwipeLeft).toHaveBeenCalledOnce()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('a short drag is not a swipe', async () => {
    const onSwipe = vi.fn()
    const onCancel = vi.fn()
    const wrapper = mount(Swipeable({ onSwipe, onCancel }))
    await gesture(wrapper, [100, 50], [110, 50])

    expect(onSwipe).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  // A finger that wanders off the axis is scrolling, and stealing it would
  // fight the scroller it belongs to.
  it('a drag that wanders off its axis is left alone', async () => {
    const onSwipe = vi.fn()
    const wrapper = mount(Swipeable({ onSwipe }))
    await gesture(wrapper, [200, 50], [80, 160])
    expect(onSwipe).not.toHaveBeenCalled()
  })

  // The clock comes from the events themselves, which a test cannot forge —
  // timeStamp is read-only — so distance is checked exactly and velocity for
  // being a real, positive reading.
  it('reports distance and velocity', async () => {
    const onSwipe = vi.fn()
    const wrapper = mount(Swipeable({ onSwipe }))
    await gesture(wrapper, [200, 50], [80, 50])

    const sample = onSwipe.mock.calls[0][0]
    expect(sample.distance).toBe(120)
    expect(sample.velocity).toBeGreaterThan(0)
    expect(Number.isFinite(sample.velocity)).toBe(true)
  })

  it('follows the finger while it moves', async () => {
    const onMove = vi.fn()
    const wrapper = mount(Swipeable({ onMove }))
    await gesture(wrapper, [200, 50], [150, 50])
    expect(onMove).toHaveBeenCalledWith({ x: -50, y: 0 })
  })

  it('an edge gesture only starts near that edge', async () => {
    const onSwipe = vi.fn()
    const wrapper = mount(Swipeable({ edge: 'left', edgeWidth: 20, onSwipe }))
    // happy-dom reports a zero-size box, so the element's left edge is 0
    await gesture(wrapper, [100, 50], [220, 50])
    expect(onSwipe, 'started far from the edge').not.toHaveBeenCalled()

    await gesture(wrapper, [10, 50], [140, 50])
    expect(onSwipe, 'started on the edge').toHaveBeenCalledOnce()
  })

  it('a cancelled pointer releases the gesture', async () => {
    const onCancel = vi.fn()
    const wrapper = mount(Swipeable({ onCancel }))
    await nextTick()
    const el = wrapper.find('.target').element
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 50, pointerId: 1 }))
    el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('stops listening once unmounted', async () => {
    const onSwipe = vi.fn()
    const wrapper = mount(Swipeable({ onSwipe }))
    await nextTick()
    const el = wrapper.find('.target').element
    wrapper.unmount()

    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 200, clientY: 50, pointerId: 1 }))
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 60, clientY: 50, pointerId: 1 }))
    expect(onSwipe).not.toHaveBeenCalled()
  })
})

describe('SwipeActions', () => {
  const trailing = [
    { label: 'Delete', id: 'del', role: 'destructive' as const },
    { label: 'Flag', id: 'flag' },
  ]

  const mountRow = (props: Record<string, unknown> = {}) => mount(SwipeActions, {
    props: { trailing, ...props },
    slots: { default: '<p class="row">Inbox row</p>' },
    attachTo: document.body,
  })

  const drag = async (wrapper: ReturnType<typeof mount>, dx: number) => {
    await nextTick()
    const el = wrapper.element
    const send = (type: string, x: number) =>
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: 20, pointerId: 1 }))
    send('pointerdown', 300)
    send('pointermove', 300 + dx)
    send('pointerup', 300 + dx)
    await wrapper.vm.$nextTick()
  }

  it('sits closed with the row in place', () => {
    const wrapper = mountRow()
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(0px)')
    wrapper.unmount()
  })

  it('renders one slab button per action', () => {
    const wrapper = mountRow()
    expect(wrapper.findAll('.swipe-action')).toHaveLength(2)
    wrapper.unmount()
  })

  it('a small drag springs back', async () => {
    const wrapper = mountRow()
    await drag(wrapper, -20)
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(0px)')
    wrapper.unmount()
  })

  it('a real swipe parks the row open', async () => {
    const wrapper = mountRow()
    await drag(wrapper, -120)
    const transform = wrapper.find('.swipe-content').attributes('style')
    expect(transform).toContain('translateX(-168px)') // two actions × 84
    wrapper.unmount()
  })

  it('tapping a revealed action reports it and closes', async () => {
    const wrapper = mountRow()
    await drag(wrapper, -120)
    await wrapper.findAll('.swipe-action')[0].trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual([trailing[0]])
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(0px)')
    wrapper.unmount()
  })

  it('disabled leaves the row where it is', async () => {
    const wrapper = mountRow({ disabled: true })
    await drag(wrapper, -120)
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(0px)')
    wrapper.unmount()
  })

  it('leading actions open the other way', async () => {
    const wrapper = mountRow({ trailing: [], leading: [{ label: 'Pin', id: 'pin' }] })
    await drag(wrapper, 120)
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(84px)')
    wrapper.unmount()
  })

  // A gesture nobody can perform is a feature only some users get.
  it('offers the same actions as real buttons for keyboard and screen readers', () => {
    const wrapper = mountRow()
    const fallback = wrapper.findAll('.swipe-fallback-button')
    expect(fallback).toHaveLength(2)
    expect(fallback[0].text()).toBe('Delete')

    // the decorative slabs must not be a second copy in the reading order
    expect(wrapper.find('.swipe-slab--trailing').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.swipe-action')[0].attributes('tabindex')).toBe('-1')
    wrapper.unmount()
  })

  // Real browsers report a width; happy-dom does not, and a threshold
  // computed from zero would make the lightest drag run Delete.
  it('a row of unknown width never full-swipes', async () => {
    const wrapper = mountRow()
    await drag(wrapper, -400)
    expect(wrapper.emitted('select'), 'nothing ran on its own').toBeUndefined()
    wrapper.unmount()
  })

  it('a swipe across most of a measured row runs the first action', async () => {
    const wrapper = mountRow()
    await nextTick()
    wrapper.element.getBoundingClientRect = () => ({ width: 320, height: 44 }) as DOMRect

    await drag(wrapper, -220) // past 60% of 320
    expect(wrapper.emitted('select')?.[0]).toEqual([trailing[0]])
    wrapper.unmount()
  })

  it('allowsFullSwipe=false parks it open instead', async () => {
    const wrapper = mountRow({ allowsFullSwipe: false })
    await nextTick()
    wrapper.element.getBoundingClientRect = () => ({ width: 320, height: 44 }) as DOMRect

    await drag(wrapper, -220)
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.find('.swipe-content').attributes('style')).toContain('translateX(-168px)')
    wrapper.unmount()
  })

  it('the fallback button runs the action', async () => {
    const wrapper = mountRow()
    await wrapper.findAll('.swipe-fallback-button')[0].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([trailing[0]])
    wrapper.unmount()
  })
})
