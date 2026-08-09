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

function reducedMotion(): boolean {
  return typeof matchMedia !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * SwiftUI's `withAnimation(_:_:)`: run a state mutation and animate every
 * visual difference it causes, via the View Transitions API.
 *
 * ```ts
 * withAnimation(() => { expanded.value = !expanded.value })
 * withAnimation(() => items.value.sort(), Animations.spring)
 * ```
 *
 * Where view transitions are unavailable (SSR, older browsers) or the user
 * prefers reduced motion, the mutation simply applies unanimated. The
 * returned promise resolves with the mutation's return value once the
 * animation — if any — has finished.
 */
export function withAnimation<T>(
  mutate: () => T,
  animation: SwiftAnimation = Animations.default,
): Promise<T> {
  const doc = (typeof document === 'undefined' ? null : document) as ViewTransitionDocument | null

  if (!doc?.startViewTransition || reducedMotion()) {
    const result = mutate()
    return nextTick().then(() => result)
  }

  const root = doc.documentElement
  root.style.setProperty('--swift-vt-duration', `${animation.duration ?? 250}ms`)
  root.style.setProperty('--swift-vt-easing', animation.easing ?? 'ease')

  let result!: T
  const transition = doc.startViewTransition(async () => {
    result = mutate()
    await nextTick() // the DOM must update inside the snapshot window
  })

  return transition.finished
    .catch(() => { /* a skipped transition still applied the mutation */ })
    .then(() => result)
}
