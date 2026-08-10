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

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => Promise<void>) => { finished: Promise<void> }
}

export interface WithAnimationOptions {
  /**
   * The element, or elements, that actually change.
   *
   * Without this, the View Transitions API snapshots the whole page and
   * cross-fades it, because it has no way to know what moved — and that
   * page-wide fade is a visible flash even when a single card changed. Name
   * the element that changes and it is lifted out of the page snapshot and
   * animated on its own; the rest of the screen is identical before and
   * after, so it holds still.
   *
   * This is the piece SwiftUI gets for free: it knows the dependency graph,
   * so `withAnimation` there already animates only the views that changed.
   * On the web that knowledge has to be supplied — either here, or once per
   * region with the `v-animate` directive, which this falls back to when
   * `scope` is omitted entirely.
   *
   * Pass a template ref's `.value`. A nullish entry is skipped, so an
   * unmounted ref is harmless. Passing `null` explicitly forces the
   * whole-page transition even when `v-animate` markers exist.
   */
  scope?: Element | null | undefined | Array<Element | null | undefined>
}

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The elements marked `v-animate`. This is SwiftUI's implicit knowledge made
 * explicit: SwiftUI knows which views depend on a changed value and animates
 * only those; here you mark the views that may animate, once, and a scopeless
 * `withAnimation` names every one of them before the snapshot. Only those
 * whose pixels actually changed move — a named element with an identical
 * before and after simply sits there — so the call animates exactly the
 * marked views that the mutation touched, and the rest of the page holds still.
 */
const animatable = new Set<HTMLElement>()

/** The `v-animate` directive's hook. Returns its own removal. */
export function registerAnimatable(el: HTMLElement): () => void {
  animatable.add(el)
  return () => { animatable.delete(el) }
}

// A process-wide counter, so two elements named in the same transition never
// collide — the API rejects a transition with a duplicate `view-transition-name`.
let vtCounter = 0

// How many withAnimation calls are currently naming each element, and the
// name it carried before the first of them touched it. Reference counting is
// what makes overlapping calls safe: naively saving and restoring the
// previous name lets a superseded call that finishes first restore an empty
// string while a later call's own restore then writes a stale swift-vt-* name
// back — which never clears, and every later transition on that element
// restores the wrong value in turn. Instead the original is captured once, on
// the first acquire, and put back once, when the last release brings the
// count to zero. A call that finishes while others are still running leaves
// the name alone.
interface Ownership { original: string, active: number }
const owners = new WeakMap<HTMLElement, Ownership>()

/**
 * Give each scoped element a fresh unique `view-transition-name`. Set before
 * the old snapshot is taken and kept through the mutation, so the element is
 * the same named box on both sides and morphs rather than cross-fades.
 */
function acquireScope(scope: WithAnimationOptions['scope']): HTMLElement[] {
  if (!scope) return []
  const els = Array.isArray(scope) ? scope : [scope]
  const acquired: HTMLElement[] = []
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue
    let state = owners.get(el)
    if (!state) {
      state = { original: el.style.getPropertyValue('view-transition-name'), active: 0 }
      owners.set(el, state)
    }
    state.active += 1
    el.style.setProperty('view-transition-name', `swift-vt-${vtCounter++}`)
    acquired.push(el)
  }
  return acquired
}

function releaseScope(acquired: HTMLElement[]) {
  for (const el of acquired) {
    const state = owners.get(el)
    if (!state) continue
    state.active -= 1
    // Still animating under another call — that call owns the current name
    // and will restore the original when it is the one to reach zero.
    if (state.active > 0) continue
    if (state.original) el.style.setProperty('view-transition-name', state.original)
    else el.style.removeProperty('view-transition-name')
    owners.delete(el)
  }
}

/**
 * SwiftUI's `withAnimation(_:_:)`: run a state mutation and animate every
 * visual difference it causes, via the View Transitions API.
 *
 * ```ts
 * withAnimation(() => { expanded.value = !expanded.value })
 * withAnimation(() => items.value.sort(), Animations.spring)
 *
 * // animate only the card, so the rest of the page does not flash:
 * withAnimation(() => { expanded.value = !expanded.value }, Animations.spring, { scope: cardEl.value })
 * ```
 *
 * Without a `scope` the whole page is snapshotted and cross-faded — see
 * `WithAnimationOptions.scope` for why that flashes and when to reach for it.
 *
 * Where view transitions are unavailable (SSR, older browsers) or the user
 * prefers reduced motion, the mutation simply applies unanimated. The
 * returned promise resolves with the mutation's return value once the
 * animation — if any — has finished.
 */
export function withAnimation<T>(
  mutate: () => T,
  animation: SwiftAnimation = Animations.default,
  options: WithAnimationOptions = {},
): Promise<T> {
  const doc = (typeof document === 'undefined' ? null : document) as ViewTransitionDocument | null

  if (!doc?.startViewTransition || reducedMotion()) {
    const result = mutate()
    return nextTick().then(() => result)
  }

  const root = doc.documentElement
  root.style.setProperty('--swift-vt-duration', `${animation.duration ?? 250}ms`)
  root.style.setProperty('--swift-vt-easing', animation.easing ?? 'ease')

  // An explicit `scope` — including `null` — wins; omit it and the
  // `v-animate` markers stand in, so a plain withAnimation() animates only
  // the marked regions the mutation actually changed. Empty registry and no
  // scope falls through to the whole-page transition, unchanged.
  const targets = 'scope' in options ? options.scope : [...animatable]
  const acquired = acquireScope(targets)

  let result!: T
  let transition: { finished: Promise<void> }
  try {
    transition = doc.startViewTransition(async () => {
      result = mutate()
      await nextTick() // the DOM must update inside the snapshot window
    })
  } catch {
    // startViewTransition threw before running the callback — the names are
    // set but no transition owns them, so release now rather than leak, and
    // apply the mutation unanimated so it is never silently dropped.
    releaseScope(acquired)
    const fallback = mutate()
    return nextTick().then(() => fallback)
  }

  return transition.finished
    .catch(() => { /* a skipped transition still applied the mutation */ })
    .then(() => {
      // Held until the animation settled: removing the name mid-flight would
      // yank the element out of the transition it is in the middle of.
      releaseScope(acquired)
      return result
    })
}
