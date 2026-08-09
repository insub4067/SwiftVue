import {
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

export function provideViewVisibility(visible: Ref<boolean>) {
  provide(viewVisibilityKey, visible)
}

/**
 * Tracks a view's own idea of being on screen, which is not the same as
 * being mounted: NavigationStack keeps a covered pane alive so popping back
 * restores it intact, and a covered pane has disappeared.
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

  if (visible) watch(visible, (isVisible) => (isVisible ? show() : hide()))

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
