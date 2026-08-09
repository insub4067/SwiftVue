import { watch, type WatchSource, type WatchStopHandle } from 'vue'

export interface OnChangeOptions {
  /** watch nested mutations of objects and arrays */
  deep?: boolean
  /** also fire once with the current value, like onChange(of:initial:) */
  initial?: boolean
}

/**
 * SwiftUI's `.onChange(of:)`: run a side effect when a value changes,
 * receiving the new and old values. A thin veneer over `watch` so SwiftUI
 * code translates one-to-one; inside a component it stops automatically
 * on unmount, and the returned handle stops it earlier.
 *
 * ```ts
 * onChange(volume, (value, oldValue) => save(value))
 * onChange(() => props.user, reload, { initial: true })
 * ```
 */
export function onChange<T>(
  source: WatchSource<T>,
  callback: (value: T, oldValue: T | undefined) => void,
  options: OnChangeOptions = {},
): WatchStopHandle {
  return watch(source, (value, oldValue) => callback(value, oldValue), {
    deep: options.deep,
    immediate: options.initial,
  })
}
