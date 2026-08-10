import { nextTick } from 'vue'

export interface SwiftAnimation {
  /** milliseconds */
  duration?: number
  /** CSS timing function */
  easing?: string
}

/**
 * SwiftUI's named animations, as duration + easing pairs. Springs are
 * cubic-bezier approximations — close enough for UI transitions without
 * dragging in a physics runtime.
 */
export const Animations = {
  default: { duration: 250, easing: 'ease' },
  linear: { duration: 250, easing: 'linear' },
  easeIn: { duration: 250, easing: 'ease-in' },
  easeOut: { duration: 250, easing: 'ease-out' },
  easeInOut: { duration: 350, easing: 'ease-in-out' },
  /** classic spring with a hint of overshoot */
  spring: { duration: 500, easing: 'cubic-bezier(0.32, 1.15, 0.35, 1)' },
  /** iOS 17 smooth — no bounce */
  smooth: { duration: 450, easing: 'cubic-bezier(0.25, 0.6, 0.35, 1)' },
  /** iOS 17 snappy — small bounce, fast settle */
  snappy: { duration: 350, easing: 'cubic-bezier(0.3, 1.06, 0.4, 1)' },
  /** iOS 17 bouncy — pronounced overshoot */
  bouncy: { duration: 550, easing: 'cubic-bezier(0.34, 1.36, 0.4, 1)' },
} as const satisfies Record<string, SwiftAnimation>

export interface WithAnimationOptions {
  /**
   * The element, or elements, whose *position* the change moves — a row that
   * slides to a new place, a card pushed down by content appearing above it.
   *
   * withAnimation measures each one before the mutation and again after, and
   * animates it from where it was to where it landed (a FLIP). This is the
   * same thing SwiftUI does implicitly, and the reason it needs telling here:
   * SwiftUI knows which views a value drives; on the web the moved elements
   * have to be named, either with this or once per region via `v-animate`,
   * which `withAnimation` falls back to when `scope` is omitted.
   *
   * Pass a template ref's `.value`. A nullish entry is skipped, so an
   * unmounted ref is harmless. An element whose position did not change is
   * left alone, so over-marking costs nothing.
   */
  scope?: Element | null | undefined | Array<Element | null | undefined>
}

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The elements marked `v-animate`. This is SwiftUI's implicit knowledge made
 * explicit: SwiftUI moves only the views a changed value drives; here you
 * mark the views that may move, once, and a scopeless `withAnimation`
 * measures every one of them. Only those whose position actually changed are
 * animated, so the mark is a candidate list, not a command.
 */
const animatable = new Set<HTMLElement>()

/** The `v-animate` directive's hook. Returns its own removal. */
export function registerAnimatable(el: HTMLElement): () => void {
  animatable.add(el)
  return () => { animatable.delete(el) }
}

function collect(scope: WithAnimationOptions['scope']): HTMLElement[] {
  if (!scope) return []
  const els = Array.isArray(scope) ? scope : [scope]
  return els.filter((e): e is HTMLElement => e instanceof HTMLElement)
}

/** Resolve an animation's end without depending on the `.finished` promise, which stubs omit. */
function settled(anim: Animation): Promise<void> {
  return new Promise((resolve) => {
    anim.onfinish = () => resolve()
    anim.oncancel = () => resolve()
  })
}

/**
 * SwiftUI's `withAnimation(_:_:)`: run a state mutation and animate the
 * layout change it causes.
 *
 * ```ts
 * withAnimation(() => { expanded.value = !expanded.value })
 * withAnimation(() => items.value.sort(), Animations.spring)
 *
 * // move just this row, named at the call site:
 * withAnimation(() => items.value.sort(), Animations.spring, { scope: rowEl.value })
 * ```
 *
 * It is a FLIP: each tracked element is measured before the change and after,
 * and animated with a `transform` from its old position to its new one — on
 * the live element, with the Web Animations API. There is no page snapshot
 * and no cross-fade, so nothing dips toward the page background: the thing
 * that made the old View-Transitions implementation flash cannot happen here.
 *
 * An earlier version drove the View Transitions API. It flashed on real iOS
 * Safari — the whole page washed toward its background mid-transition,
 * because even an unchanged page cross-fades and goes translucent at the
 * midpoint. This does not.
 *
 * Where there is no DOM (SSR) or the user prefers reduced motion, the
 * mutation simply applies. The returned promise resolves with the mutation's
 * value once the movement — if any — has finished.
 */
export function withAnimation<T>(
  mutate: () => T,
  animation: SwiftAnimation = Animations.default,
  options: WithAnimationOptions = {},
): Promise<T> {
  const canAnimate = typeof document !== 'undefined' && !reducedMotion()

  // Explicit `scope` wins; omit it and the `v-animate` markers stand in.
  // Nothing marked and no scope means nothing to move — the mutation just
  // applies, which is the right no-op: a page that flagged nothing as
  // animatable asked for no animation, not a whole-page one.
  const targets = canAnimate
    ? collect('scope' in options ? options.scope : [...animatable])
    : []

  // FIRST — where everything is before the change.
  const before = new Map<HTMLElement, DOMRect>()
  for (const el of targets) before.set(el, el.getBoundingClientRect())

  const result = mutate()

  return nextTick().then(() => {
    const running: Array<Promise<void>> = []
    for (const el of targets) {
      // Gone from the page, or an environment without the Web Animations API.
      if (!el.isConnected || typeof el.animate !== 'function') continue
      const first = before.get(el)!
      const last = el.getBoundingClientRect()
      const dx = first.left - last.left
      const dy = first.top - last.top
      // Left where it was — animating a zero move would only cost a frame.
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      // INVERT to the old position, then PLAY back to the new one. `fill:
      // none` leaves the element at its natural place when the run ends.
      const anim = el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }],
        { duration: animation.duration ?? 250, easing: animation.easing ?? 'ease', fill: 'none' },
      )
      running.push(settled(anim))
    }
    return Promise.all(running).then(() => result)
  })
}
