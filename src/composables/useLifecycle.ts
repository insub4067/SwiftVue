import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue'

/**
 * Whether the enclosing view is the one on screen. Provided by
 * NavigationStack for each pane; absent everywhere else, where a mounted
 * view is by definition the visible one.
 */
export const viewVisibilityKey: InjectionKey<Ref<boolean>> = Symbol('swiftvue-view-visible')

/**
 * Provides a pane's on-screen state to its descendants, gated by any pane it
 * is nested inside. A view is visible only when its own pane is the active
 * one *and* every stack above it is showing the branch it sits in — so a
 * NavigationStack pushed inside another stack's pane reports its active pane
 * as hidden while that outer pane is covered, instead of firing `onAppear`
 * for a screen the user cannot see.
 */
export function provideViewVisibility(visible: Ref<boolean>) {
  const parent = inject(viewVisibilityKey, null)
  provide(
    viewVisibilityKey,
    parent ? computed(() => parent.value && visible.value) : visible,
  )
}

/**
 * Tracks a view's own idea of being on screen, which is not the same as
 * being mounted: NavigationStack keeps a covered pane alive so popping back
 * restores it intact, and a covered pane has disappeared.
 *
 * `show`/`hide` are synchronous and guarded by `shown`, so an appear always
 * precedes its disappear and neither fires twice — the ordering SwiftUI
 * guarantees. The visibility watch runs `post` flush so a handler that reads
 * the DOM sees the state the change produced, without deferring the call
 * itself (a deferred appear could be overtaken by a synchronous hide and be
 * dropped, leaving a disappear with no matching appear).
 */
function useAppearance(onShow?: () => void, onHide?: () => void) {
  const visible = inject(viewVisibilityKey, null)
  let shown = false

  const show = () => {
    if (shown) return
    shown = true
    onShow?.()
  }

  const hide = () => {
    if (!shown) return
    shown = false
    onHide?.()
  }

  onMounted(() => {
    if (!visible || visible.value) show()
  })

  if (visible) {
    watch(visible, (isVisible) => (isVisible ? show() : hide()), { flush: 'post' })
  }

  // Before rather than after: a handler may still want to read the DOM it is
  // about to lose.
  onBeforeUnmount(hide)
}

/**
 * SwiftUI's `.onAppear`. Runs when the view reaches the screen, and again
 * each time it comes back after being covered — which is what makes it the
 * place to refresh a screen the user has navigated back to.
 *
 * ```ts
 * onAppear(() => reload())
 * ```
 *
 * "Covered" means a NavigationStack pushed another screen over it. For work
 * that should outlive that, use Vue's `onMounted`/`onUnmounted` instead:
 * those follow the component, not its visibility.
 */
export function onAppear(handler: () => void) {
  useAppearance(handler, undefined)
}

/**
 * SwiftUI's `.onDisappear`. Runs when the view leaves the screen, whether it
 * was unmounted or covered by a pushed screen. It fires once per
 * disappearance, so a covered view that is then unmounted reports once.
 */
export function onDisappear(handler: () => void) {
  useAppearance(undefined, handler)
}
