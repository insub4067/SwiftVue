import type { Directive } from 'vue'
import { registerAnimatable } from './withAnimation'

/**
 * `v-animate` — mark a region as animatable, the way every SwiftUI view
 * implicitly is.
 *
 * ```vue
 * <TodoCard v-animate :todo="todo" />
 * <!-- then, anywhere: -->
 * withAnimation(() => { todo.done = !todo.done })
 * ```
 *
 * A scopeless `withAnimation` names every marked element before it snapshots
 * the page, so the ones whose pixels changed animate and everything else —
 * marked or not — holds still. That is the SwiftUI behaviour: you change the
 * state and only the views that depend on it move, without naming an element
 * at the call site.
 *
 * It adds no DOM — it names the element it is placed on. Two caveats follow
 * from how the View Transitions API works:
 *
 * - Place it on a single-root element or component. On a fragment (multiple
 *   root nodes) Vue has no single element to attach to, and the mark is lost.
 * - Do not nest marks. A named element is captured as a flat image with its
 *   named descendants lifted out of it, so marking a card *and* a row inside
 *   it makes the card animate around a hole. Mark the level you want to move.
 */
export const vAnimate: Directive<HTMLElement> = {
  // A directive can be bound to the same element only once, so a single
  // cleanup per element is all that is needed — kept on the element itself
  // rather than in a module map that would outlive it.
  mounted(el) {
    ;(el as HTMLElement & { _swiftAnimateOff?: () => void })._swiftAnimateOff = registerAnimatable(el)
  },
  unmounted(el) {
    const host = el as HTMLElement & { _swiftAnimateOff?: () => void }
    host._swiftAnimateOff?.()
    delete host._swiftAnimateOff
  },
}
