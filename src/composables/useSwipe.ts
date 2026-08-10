import { onBeforeUnmount, watch, type Ref } from 'vue'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeSample {
  direction: SwipeDirection
  /** how far the gesture travelled along its axis, in px */
  distance: number
  /** px per ms along that axis — a flick is fast and short */
  velocity: number
}

export interface SwipeOptions {
  /** px along the axis before a press counts as a swipe */
  threshold?: number
  /** how far it may drift across the axis before it is a different gesture */
  tolerance?: number
  /** only start within this many px of the named edge */
  edge?: 'left' | 'right' | 'top' | 'bottom'
  edgeWidth?: number
  /** live movement, called while a finger is down and moving */
  onMove?: (delta: { x: number; y: number }) => void
  /** the gesture ended without qualifying — put whatever moved back */
  onCancel?: () => void
  onSwipe?: (sample: SwipeSample) => void
  onSwipeLeft?: (sample: SwipeSample) => void
  onSwipeRight?: (sample: SwipeSample) => void
  onSwipeUp?: (sample: SwipeSample) => void
  onSwipeDown?: (sample: SwipeSample) => void
}

const DEFAULTS = { threshold: 50, tolerance: 45, edgeWidth: 28 }

/**
 * Past this much movement the press was a drag, and the click the browser
 * sends afterwards is not a tap the content should act on. Small enough that
 * an unsteady finger on a real tap still gets through.
 */
const DRAG_NOT_A_TAP = 8

/**
 * Pointer-driven swipe detection on one element.
 *
 * Pointer events rather than touch: one code path covers finger, trackpad
 * and stylus, which is what makes the same gesture testable and usable with
 * a mouse.
 *
 * ```ts
 * const row = ref<HTMLElement | null>(null)
 * useSwipe(row, { onSwipeLeft: () => reveal() })
 * ```
 */
export function useSwipe(target: Ref<HTMLElement | null>, options: SwipeOptions = {}) {
  const opts = { ...DEFAULTS, ...options }

  let start: { x: number; y: number; t: number } | null = null
  let pointerId: number | null = null
  let el: HTMLElement | null = null

  function withinEdge(e: PointerEvent, box: DOMRect): boolean {
    if (!opts.edge) return true
    const w = opts.edgeWidth
    if (opts.edge === 'left') return e.clientX - box.left <= w
    if (opts.edge === 'right') return box.right - e.clientX <= w
    if (opts.edge === 'top') return e.clientY - box.top <= w
    return box.bottom - e.clientY <= w
  }

  function onPointerDown(e: PointerEvent) {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!withinEdge(e, box)) return
    start = { x: e.clientX, y: e.clientY, t: e.timeStamp }
    pointerId = e.pointerId
    // The rest of this gesture belongs to this element, wherever the pointer
    // goes. Without capture the browser keeps re-deciding what is under the
    // pointer as the row slides, and reports the pointer as having left an
    // element it never actually left — which killed the swipe mid-drag. It
    // also means the release is always reported here, even when the finger
    // lifts somewhere else entirely.
    el?.setPointerCapture?.(e.pointerId)
  }

  function releaseCapture() {
    if (pointerId == null) return
    if (el?.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!start || e.pointerId !== pointerId) return
    opts.onMove?.({ x: e.clientX - start.x, y: e.clientY - start.y })
  }

  /**
   * A drag is followed by a `click`, and the content underneath cannot tell
   * it apart from a tap — so an iOS row swiped open would also open the
   * screen it links to. Swallow that one click, in the capture phase, before
   * anything inside the element sees it.
   *
   * The timeout is the escape hatch: if no click follows — the pointer went
   * up somewhere else, the browser suppressed it — the listener must not sit
   * there waiting to eat a real tap later on.
   */
  function swallowNextClick() {
    const element = el
    if (!element) return
    const swallow = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
      element.removeEventListener('click', swallow, true)
    }
    element.addEventListener('click', swallow, true)
    setTimeout(() => element.removeEventListener('click', swallow, true), 0)
  }

  function finish(e: PointerEvent) {
    if (!start || e.pointerId !== pointerId) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const elapsed = Math.max(1, e.timeStamp - start.t)
    releaseCapture()
    start = null
    pointerId = null

    // Judged on total movement rather than on whether the swipe qualified: a
    // drag that fell short of the threshold is still a drag, and the row it
    // dragged should not also be opened.
    if (Math.hypot(dx, dy) > DRAG_NOT_A_TAP) swallowNextClick()

    const horizontal = Math.abs(dx) > Math.abs(dy)
    const along = horizontal ? dx : dy
    const across = horizontal ? dy : dx

    // A gesture that wandered across its axis was aimed somewhere else — a
    // scroll, usually — and claiming it would fight the thing it belongs to.
    if (Math.abs(along) < opts.threshold || Math.abs(across) > opts.tolerance) {
      opts.onCancel?.()
      return
    }

    const direction: SwipeDirection = horizontal
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'up' : 'down')

    const sample: SwipeSample = {
      direction,
      distance: Math.abs(along),
      velocity: Math.abs(along) / elapsed,
    }

    opts.onSwipe?.(sample)
    if (direction === 'left') opts.onSwipeLeft?.(sample)
    else if (direction === 'right') opts.onSwipeRight?.(sample)
    else if (direction === 'up') opts.onSwipeUp?.(sample)
    else opts.onSwipeDown?.(sample)
  }

  function onPointerCancel(e: PointerEvent) {
    if (!start || e.pointerId !== pointerId) return
    releaseCapture()
    start = null
    pointerId = null
    opts.onCancel?.()
  }

  function bind(next: HTMLElement | null) {
    if (el) {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', finish)
      el.removeEventListener('pointercancel', onPointerCancel)
      el.removeEventListener('lostpointercapture', onPointerCancel)
    }
    el = next
    if (!el) return
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', finish)
    el.addEventListener('pointercancel', onPointerCancel)
    // Not `pointerleave`: a drag is allowed to wander off the element, and
    // the browser fires leave during one anyway as the element under the
    // pointer changes. Losing the capture is the real "this gesture is no
    // longer yours" — the browser took it, so put back whatever moved.
    el.addEventListener('lostpointercapture', onPointerCancel)
  }

  // post, not the default pre: a template ref is only populated once the DOM
  // is patched, so a pre-flush watcher would bind to the element the view had
  // a moment ago — nothing at all, on the first run.
  watch(target, bind, { immediate: true, flush: 'post' })
  onBeforeUnmount(() => bind(null))
}
