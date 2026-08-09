import { ref, watch, type Ref } from 'vue'

/**
 * localStorage is absent during SSR and throws on access in sandboxed
 * iframes, so resolve it once behind a guard instead of touching the
 * global directly.
 */
function resolveStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * SwiftUI @AppStorage equivalent.
 * Persists a value to localStorage and keeps it reactive.
 * Without storage (SSR, sandboxed iframe) it degrades to plain state.
 *
 * Usage:
 *   const username = useAppStorage('username', '')
 *   const isDark = useAppStorage('darkMode', false)
 */
export function useAppStorage<T>(key: string, defaultValue: T): Ref<T> {
  const storage = resolveStorage()

  let initial = defaultValue
  if (storage) {
    try {
      const stored = storage.getItem(key)
      if (stored != null) initial = JSON.parse(stored)
    } catch {
      // corrupt data — fall back to default
    }
  }
  const state = ref(initial) as Ref<T>

  if (storage) {
    watch(state, (val) => {
      try {
        storage.setItem(key, JSON.stringify(val))
      } catch {
        // quota exceeded — silently ignore
      }
    }, { deep: true })
  }

  return state
}
