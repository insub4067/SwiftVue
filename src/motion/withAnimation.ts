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
   * On the web that knowledge has to be supplied, and this is where.
   *
   * Pass a template ref's `.value`. A nullish entry is skipped, so an
   * unmounted ref is harmless.
   */
  scope?: Element | null | undefined | Array<Element | null | undefined>
}

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
}

// A process-wide counter, so two elements named in the same transition never
// collide — the API rejects a transition with a duplicate `view-transition-name`.
let vtCounter = 0

interface NamedElement { el: HTMLElement, previous: string }

/**
 * Give each scoped element a unique `view-transition-name`, remembering
 * whatever was there so it can be put back. Set before the old snapshot is
 * taken and kept through the mutation, so the element is the *same* named
 * box on both sides and morphs rather than cross-fades.
 */
function nameScope(scope: WithAnimationOptions['scope']): NamedElement[] {
  if (!scope) return []
  const els = Array.isArray(scope) ? scope : [scope]
  const named: NamedElement[] = []
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue
    const previous = el.style.getPropertyValue('view-transition-name')
    el.style.setProperty('view-transition-name', `swift-vt-${vtCounter++}`)
    named.push({ el, previous })
  }
  return named
}

function releaseScope(named: NamedElement[]) {
  for (const { el, previous } of named) {
    if (previous) el.style.setProperty('view-transition-name', previous)
    else el.style.removeProperty('view-transition-name')
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

  const named = nameScope(options.scope)

  let result!: T
  const transition = doc.startViewTransition(async () => {
    result = mutate()
    await nextTick() // the DOM must update inside the snapshot window
  })

  return transition.finished
    .catch(() => { /* a skipped transition still applied the mutation */ })
    .then(() => {
      // Held until the animation settled: removing the name mid-flight would
      // yank the element out of the transition it is in the middle of.
      releaseScope(named)
      return result
    })
}
