import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, type Ref } from 'vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import { onAppear, onDisappear, provideViewVisibility } from '../../src/composables/useLifecycle'

/** A screen that reports every appearance and disappearance. */
function tracked(appear: () => void, disappear: () => void) {
  return defineComponent({
    setup() {
      onAppear(appear)
      onDisappear(disappear)
      return () => h('p', 'screen')
    },
  })
}

describe('onAppear / onDisappear without a NavigationStack', () => {
  it('a mounted view has appeared', () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    mount(tracked(appear, disappear))

    expect(appear).toHaveBeenCalledOnce()
    expect(disappear).not.toHaveBeenCalled()
  })

  it('an unmounted view has disappeared', () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    mount(tracked(appear, disappear)).unmount()

    expect(disappear).toHaveBeenCalledOnce()
  })

  it('a view hidden by v-if reports both ends', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const Screen = tracked(appear, disappear)
    const shown = ref(true)
    mount(defineComponent({ setup: () => () => (shown.value ? h(Screen) : null) }))

    shown.value = false
    await flushPromises()
    expect(disappear).toHaveBeenCalledOnce()

    shown.value = true
    await flushPromises()
    expect(appear).toHaveBeenCalledTimes(2)
  })

  it('every handler on the same view runs', () => {
    const first = vi.fn()
    const second = vi.fn()
    mount(defineComponent({
      setup() {
        onAppear(first)
        onAppear(second)
        return () => h('p')
      },
    }))
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })
})

// The reason these are not aliases for onMounted/onUnmounted: NavigationStack
// keeps a covered pane alive so popping restores it intact, and a covered
// pane has disappeared even though it is still mounted.
describe('onAppear / onDisappear inside a NavigationStack', () => {
  // The screen is built once and reused: calling tracked() inside the slot
  // render would mint a new component type every render, and Vue would then
  // unmount and remount it — which fires these handlers for the wrong reason
  // and would let a broken implementation pass.
  const mountStack = (appear: () => void, disappear: () => void) => {
    const Screen = tracked(appear, disappear)
    return mount(NavigationStack, {
      props: { title: 'Home' },
      slots: { default: () => h(Screen) },
    })
  }

  it('the root screen appears once when the stack mounts', () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    mountStack(appear, disappear)

    expect(appear).toHaveBeenCalledOnce()
    expect(disappear).not.toHaveBeenCalled()
  })

  it('pushing over a screen makes it disappear', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const wrapper = mountStack(appear, disappear)

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()

    expect(disappear, 'covered, though still mounted').toHaveBeenCalledOnce()
    expect(appear).toHaveBeenCalledOnce()
  })

  // The whole point: this is where a SwiftUI app refreshes a list.
  it('popping back makes the screen appear again', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const wrapper = mountStack(appear, disappear)

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()
    wrapper.vm.pop()
    await flushPromises()

    expect(appear).toHaveBeenCalledTimes(2)
    expect(disappear).toHaveBeenCalledOnce()
  })

  it('a pushed screen appears when it arrives and disappears when popped', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const Detail = tracked(appear, disappear)
    const wrapper = mount(NavigationStack, { props: { title: 'Home' } })

    wrapper.vm.push({ title: 'Detail', content: () => h(Detail) })
    await flushPromises()
    expect(appear).toHaveBeenCalledOnce()
    expect(disappear).not.toHaveBeenCalled()

    wrapper.vm.pop()
    await flushPromises()
    expect(disappear).toHaveBeenCalledOnce()
  })

  // Two screens deep, the bottom one is covered once — not once per push.
  it('a screen already covered does not disappear twice', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const wrapper = mountStack(appear, disappear)

    wrapper.vm.push({ title: 'A', content: () => h('p', 'a') })
    await flushPromises()
    wrapper.vm.push({ title: 'B', content: () => h('p', 'b') })
    await flushPromises()

    expect(disappear).toHaveBeenCalledOnce()
  })

  // Unmounting something already covered must not report a second departure.
  it('unmounting a covered screen reports nothing new', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const wrapper = mountStack(appear, disappear)

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()
    expect(disappear).toHaveBeenCalledOnce()

    wrapper.unmount()
    expect(disappear, 'it had already gone').toHaveBeenCalledOnce()
  })

  it('the pane wrapper adds no element of its own', () => {
    const wrapper = mount(NavigationStack, {
      props: { title: 'Home' },
      slots: { default: '<p class="row">Row</p>' },
    })
    expect(wrapper.find('.nav-pane').element.children).toHaveLength(1)
    expect(wrapper.find('.nav-pane > .row').exists()).toBe(true)
  })

  // Counts alone would pass an implementation that fired the pair out of order
  // or dropped an appear it had already begun — an appear deferred to a
  // microtask can be overtaken by a synchronous hide. The ordered log pins
  // that an appear always precedes its disappear and none is lost.
  it('appear and disappear stay ordered and balanced across push/pop', async () => {
    const log: string[] = []
    const wrapper = mountStack(() => log.push('appear'), () => log.push('disappear'))

    expect(log).toEqual(['appear'])

    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await flushPromises()
    expect(log).toEqual(['appear', 'disappear'])

    wrapper.vm.pop()
    await flushPromises()
    expect(log).toEqual(['appear', 'disappear', 'appear'])
  })
})

// A NavigationStack nested inside another stack's pane provides its own
// visibility; without gating it on the outer pane, its active screen would
// claim to be on screen while the whole nested stack sits covered under an
// outer push. `provideViewVisibility` combines the two, so the inner screen
// is visible only when both levels are.
describe('nested view visibility is gated by the enclosing pane', () => {
  function trackedScreen(appear: () => void, disappear: () => void) {
    return defineComponent({
      setup() {
        onAppear(appear)
        onDisappear(disappear)
        return () => h('p', 'screen')
      },
    })
  }

  // outer → inner → screen, each level a provideViewVisibility layer.
  function mountNested(outer: Ref<boolean>, inner: Ref<boolean>, appear: () => void, disappear: () => void) {
    const Screen = trackedScreen(appear, disappear)
    const Inner = defineComponent({
      setup() {
        provideViewVisibility(inner)
        return () => h(Screen)
      },
    })
    const Outer = defineComponent({
      setup() {
        provideViewVisibility(outer)
        return () => h(Inner)
      },
    })
    return mount(Outer)
  }

  it('appears only when both levels are visible', () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    mountNested(ref(false), ref(true), appear, disappear)
    expect(appear, 'the outer pane is covered').not.toHaveBeenCalled()
  })

  it('a covered outer pane hides the inner screen even while its own pane is active', async () => {
    const appear = vi.fn()
    const disappear = vi.fn()
    const outer = ref(true)
    const inner = ref(true)
    mountNested(outer, inner, appear, disappear)
    expect(appear).toHaveBeenCalledOnce()

    // Push over the OUTER stack — the inner pane never changed, yet the screen
    // must disappear because its ancestor is no longer showing.
    outer.value = false
    await flushPromises()
    expect(disappear).toHaveBeenCalledOnce()

    // Toggling the inner pane while the outer stays covered changes nothing.
    inner.value = false
    await flushPromises()
    inner.value = true
    await flushPromises()
    expect(appear, 'still covered by the outer push').toHaveBeenCalledOnce()

    // Popping the outer stack back brings it on screen again.
    outer.value = true
    await flushPromises()
    expect(appear).toHaveBeenCalledTimes(2)
  })
})
