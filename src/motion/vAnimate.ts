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
 * A scopeless `withAnimation` measures every marked element before the change
 * and after, and slides the ones whose position moved from where they were to
 * where they landed — a FLIP, on the live element. Everything else, marked or
 * not, holds still. That is the SwiftUI behaviour: you change the state and
 * only the affected views move, without naming an element at the call site.
 *
 * It adds no DOM — it marks the element it is placed on. Two things to know:
 *
 * - Place it on a single-root element or component. On a fragment (multiple
 *   root nodes) Vue has no single element to attach to, and the mark is lost.
 * - Nesting is fine, and is how you slide children *within* a moving parent:
 *   mark a list and each row in it, and a reorder slides the rows while the
 *   list stays put. Only an element whose *position* changes is animated, so
 *   marking one that never moves costs nothing.
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
