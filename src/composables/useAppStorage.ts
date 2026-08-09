import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

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

// Every ref bound to a key, so writing through one updates the others.
// SwiftUI's @AppStorage behaves as a single source of truth per key.
const bound = new Map<string, Set<Ref<unknown>>>()

function share(key: string, state: Ref<unknown>) {
  let refs = bound.get(key)
  if (!refs) bound.set(key, refs = new Set())
  refs.add(state)
  return () => {
    refs.delete(state)
    if (!refs.size) bound.delete(key)
  }
}

function broadcast(key: string, value: unknown, from: Ref<unknown>) {
  for (const other of bound.get(key) ?? []) {
    if (other !== from) other.value = value
  }
}

let listening = false

/** Another tab wrote this key — mirror it into every ref bound to it. */
function startTabSync() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('storage', (event) => {
    if (!event.key) return
    const refs = bound.get(event.key)
    if (!refs?.size) return
    let next: unknown
    try {
      next = event.newValue == null ? null : JSON.parse(event.newValue)
    } catch {
      return // another writer put something we cannot read; leave state alone
    }
    if (next === null) return
    for (const state of refs) state.value = next
  })
}

/**
 * SwiftUI @AppStorage equivalent.
 * Persists a value to localStorage and keeps it reactive. Refs sharing a key
 * stay in step, including across browser tabs.
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
    const release = share(key, state as Ref<unknown>)
    startTabSync()

    watch(state, (value) => {
      try {
        storage.setItem(key, JSON.stringify(value))
      } catch {
        // quota exceeded — silently ignore
      }
      broadcast(key, value, state as Ref<unknown>)
    }, { deep: true })

    if (getCurrentScope()) onScopeDispose(release)
  }

  return state
}
