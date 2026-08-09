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
  const stored = localStorage.getItem(key)
  const initial = stored != null ? JSON.parse(stored) : defaultValue
  const state = ref(initial) as Ref<T>

  watch(state, (val) => {
    localStorage.setItem(key, JSON.stringify(val))
  }, { deep: true })

  return state
}
