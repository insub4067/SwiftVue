// The directive is the wire between a template mark and the animation
// registry. Its whole job is a lifecycle one — register on mount, and
// crucially deregister on unmount, or a removed element's stale reference
// would be named in every later transition and rejected for pointing at
// nothing. So the test drives it through a real mount and unmount.
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { vAnimate } from '../../src/motion/vAnimate'
import { withAnimation, Animations } from '../../src/motion/withAnimation'

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }
const doc = document as VTDocument

afterEach(() => { delete doc.startViewTransition })

/** Whether a scopeless withAnimation names `el` — i.e. it is in the registry. */
async function isAnimated(el: HTMLElement): Promise<boolean> {
  let named = false
  doc.startViewTransition = (update) => {
    named = !!el.style.getPropertyValue('view-transition-name')
    return { finished: update() }
  }
  await withAnimation(() => {}, Animations.default)
  return named
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
