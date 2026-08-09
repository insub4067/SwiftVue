import { inject, provide, type InjectionKey } from 'vue'

/**
 * The submit action a field should run. Each `onSubmit` provides a new one
 * that calls its own handler and then the one it inherited, so nested
 * handlers run innermost first — the order SwiftUI uses.
 */
export const submitKey: InjectionKey<() => void> = Symbol('swiftvue-submit')

/**
 * SwiftUI's `.onSubmit`. Runs when the user submits a text field anywhere
 * below this view — Return in a `TextField` or `SecureField`.
 *
 * ```ts
 * onSubmit(() => search(query.value))
 * ```
 *
 * It reaches descendants, so one handler can serve a whole screen of fields
 * rather than each field wiring `@submit` itself. Nested handlers both run,
 * innermost first.
 *
 * A `<Form>` keeps its own `@submit` for the form's own submission — the
 * button press, or Return where the browser treats that as submitting the
 * form. This is the field-level event, and the two do not stand in for each
 * other.
 */
export function onSubmit(handler: () => void) {
  const parent = inject(submitKey, null)
  provide(submitKey, () => {
    handler()
    parent?.()
  })
}

/** The action a field runs on Return, or null when nothing is listening. */
export function useSubmitAction(): (() => void) | null {
  return inject(submitKey, null)
}
