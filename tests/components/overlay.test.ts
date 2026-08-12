// `.overlay` and `.background`. The two share a geometry — a layer that fills
// the content's box without adding to its size, aligned within it — and
// differ only in which side of the content it is painted on. These pin the
// three things that geometry has to get right: the content decides the size,
// the layer is aligned the way SwiftUI names it, and clicks fall through the
// empty parts of an overlay to the content beneath.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Overlay, { type OverlayAlignment } from '../../src/components/layout/Overlay.vue'
import Background from '../../src/components/layout/Background.vue'

const style = (el: Element) => (el as HTMLElement).style

describe('Overlay', () => {
  it('is a positioning context that hugs its content', () => {
    const w = mount(Overlay, { slots: { default: 'base', overlay: 'badge' } })
    expect(style(w.element).position, 'the layer is placed against this').toBe('relative')
    expect(style(w.element).display, 'sized to content, like SwiftUI').toBe('inline-block')
  })

  it('lays the overlay over the content without changing its size', () => {
    const w = mount(Overlay, { slots: { default: 'base', overlay: 'badge' } })
    const layer = w.find('.swift-overlay-layer')
    expect(layer.exists()).toBe(true)
    // absolute + inset:0 means it fills the box and contributes nothing to it
    expect(style(layer.element).position).toBe('absolute')
    expect(style(layer.element).inset).toBe('0')
    // content first, layer last — so the layer paints on top of the content
    expect(w.text()).toContain('base')
    expect(w.element.lastElementChild?.classList.contains('swift-overlay-layer')).toBe(true)
  })

  // Source order alone is not enough: content that carries its own z-index
  // could climb over the overlay. The root opens a stacking context and each
  // child gets an explicit level, so the overlay is above the base for good.
  it('orders the layer above the content in an isolated stacking context', () => {
    const w = mount(Overlay, { slots: { default: 'base', overlay: 'badge' } })
    expect(style(w.element).isolation, 'a private stacking context').toBe('isolate')
    expect(style(w.find('.swift-overlay-base').element).zIndex).toBe('0')
    expect(style(w.find('.swift-overlay-layer').element).zIndex).toBe('1')
  })

  const ALIGN: Array<[OverlayAlignment, string, string]> = [
    ['center', 'center', 'center'],
    ['topLeading', 'flex-start', 'flex-start'],
    ['topTrailing', 'flex-end', 'flex-start'],
    ['bottomLeading', 'flex-start', 'flex-end'],
    ['bottomTrailing', 'flex-end', 'flex-end'],
    ['top', 'center', 'flex-start'],
    ['leading', 'flex-start', 'center'],
    ['trailing', 'flex-end', 'center'],
  ]

  // flex-start/flex-end follow the writing direction, so `leading`/`trailing`
  // mirror in RTL for free — the same reason ZStack and the frame alignment
  // map are built on them.
  it.each(ALIGN)('aligns %s as (%s, %s)', (alignment, justify, align) => {
    const w = mount(Overlay, { props: { alignment }, slots: { default: 'b', overlay: 'o' } })
    const s = style(w.find('.swift-overlay-layer').element)
    expect(s.justifyContent).toBe(justify)
    expect(s.alignItems).toBe(align)
  })

  it('defaults to center', () => {
    const w = mount(Overlay, { slots: { default: 'b', overlay: 'o' } })
    expect(style(w.find('.swift-overlay-layer').element).justifyContent).toBe('center')
  })

  // A badge over an avatar has to be clickable, but the empty corners of the
  // layer must not eat the taps meant for the content underneath.
  it('passes clicks through empty areas but keeps the overlay itself clickable', () => {
    const w = mount(Overlay, { slots: { default: 'base', overlay: 'badge' } })
    expect(style(w.find('.swift-overlay-layer').element).pointerEvents).toBe('none')
    // the wrapper around the overlay slot takes pointer events back
    expect(style(w.find('.swift-overlay-content').element).pointerEvents).toBe('auto')
  })
})

describe('Background', () => {
  it('hugs its content and is a positioning context', () => {
    const w = mount(Background, { slots: { default: 'fg', background: 'bg' } })
    expect(style(w.element).position).toBe('relative')
    expect(style(w.element).display).toBe('inline-block')
  })

  it('paints the background behind the content, out of the content\'s flow', () => {
    const w = mount(Background, { slots: { default: 'fg', background: 'bg' } })
    const layer = w.find('.swift-background-layer')
    expect(style(layer.element).position).toBe('absolute')
    expect(style(layer.element).inset).toBe('0')
    // background first in source, content after — content paints above it,
    // and the content wrapper is its own positioned level so order can't flip.
    expect(w.element.firstElementChild?.classList.contains('swift-background-layer')).toBe(true)
    expect(style(w.find('.swift-background-content').element).position).toBe('relative')
  })

  // The order is pinned by an isolated stacking context and explicit levels,
  // not by source position — background at the floor, content above it.
  it('orders the content above the background in an isolated stacking context', () => {
    const w = mount(Background, { slots: { default: 'fg', background: 'bg' } })
    expect(style(w.element).isolation).toBe('isolate')
    expect(style(w.find('.swift-background-layer').element).zIndex).toBe('0')
    expect(style(w.find('.swift-background-content').element).zIndex).toBe('1')
  })

  it('aligns the background the same way an overlay aligns', () => {
    const w = mount(Background, { props: { alignment: 'topTrailing' }, slots: { default: 'fg', background: 'bg' } })
    const s = style(w.find('.swift-background-layer').element)
    expect(s.justifyContent).toBe('flex-end')
    expect(s.alignItems).toBe('flex-start')
  })
})
