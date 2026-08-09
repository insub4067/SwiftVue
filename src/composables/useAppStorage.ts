import { ref, watch, type Ref } from 'vue'

/**
 * SwiftUI @AppStorage equivalent.
 * Persists a value to localStorage and keeps it reactive.
 *
 * Usage:
 *   const username = useAppStorage('username', '')
 *   const isDark = useAppStorage('darkMode', false)
 */
export function useAppStorage<T>(key: string, defaultValue: T): Ref<T> {
  let initial = defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (stored != null) initial = JSON.parse(stored)
  } catch {
    // corrupt data — fall back to default
  }
  const state = ref(initial) as Ref<T>

  watch(state, (val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch {
      // quota exceeded or unavailable — silently ignore
    }
  }, { deep: true })

  return state
}
