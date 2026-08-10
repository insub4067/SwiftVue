// The directive is the wire between a template mark and the animation
// registry. Its whole job is a lifecycle one — register on mount, and
// crucially deregister on unmount, or a removed element's stale reference
// would be measured on every later withAnimation and, worse, could be
// animated after it is gone. So the test drives it through a real mount and
// unmount, and checks the registry through the behaviour it drives: whether a
// scopeless withAnimation animates the element.
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { vAnimate } from '../../src/motion/vAnimate'
import { withAnimation, Animations } from '../../src/motion/withAnimation'

afterEach(() => { document.body.innerHTML = '' })

/** Make an element report a move and record its animate() calls. */
function instrument(el: HTMLElement) {
  const rects = [{ left: 0, top: 0 }, { left: 40, top: 0 }]
  let i = 0
  el.getBoundingClientRect = (() => rects[Math.min(i++, 1)] as DOMRect)
  const calls: unknown[] = []
  el.animate = ((k: unknown, o: unknown) => {
    calls.push({ k, o })
    const a = { onfinish: null as null | (() => void), oncancel: null as null | (() => void) }
    queueMicrotask(() => a.onfinish?.())
    return a as unknown as Animation
  }) as typeof el.animate
  return calls
}

/** Whether a scopeless withAnimation animates `el` — i.e. it is in the registry. */
async function isAnimated(el: HTMLElement): Promise<boolean> {
  const calls = instrument(el)
  await withAnimation(() => {}, Animations.default)
  return calls.length > 0
}

describe('v-animate', () => {
  it('marks its element so a scopeless withAnimation animates it', async () => {
    const wrapper = mount({
      template: '<div v-animate class="card">content</div>',
    }, { global: { directives: { animate: vAnimate } }, attachTo: document.body })

    expect(await isAnimated(wrapper.element as HTMLElement)).toBe(true)
    wrapper.unmount()
  })

  it('deregisters on unmount, leaving no stale reference behind', async () => {
    const wrapper = mount({
      template: '<div v-animate class="card">content</div>',
    }, { global: { directives: { animate: vAnimate } }, attachTo: document.body })

    const el = wrapper.element as HTMLElement
    expect(await isAnimated(el)).toBe(true)

    wrapper.unmount()
    expect(await isAnimated(el), 'the removed element is no longer marked').toBe(false)
  })

  it('leaves an unmarked sibling alone', async () => {
    const wrapper = mount({
      template: '<div><p v-animate class="marked">a</p><p class="plain">b</p></div>',
    }, { global: { directives: { animate: vAnimate } }, attachTo: document.body })

    const plain = wrapper.find('.plain').element as HTMLElement
    expect(await isAnimated(plain)).toBe(false)
    wrapper.unmount()
  })
})
