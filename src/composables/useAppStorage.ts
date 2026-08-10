import { getCurrentScope, nextTick, onScopeDispose, ref, watch, type Ref } from 'vue'

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
// SwiftUI's @AppStorage behaves as a single source of truth per key. The
// fallback travels with the ref: when another tab deletes the key there is
// no value to mirror, and each ref has to go back to its own default.
interface Binding {
  state: Ref<unknown>
  fallback: unknown
  /**
   * Set while a change is being applied *from* storage, so the watcher that
   * normally writes through knows this one came the other way.
   *
   * Without it a delete undid itself: another tab removes a key, this tab's
   * refs fall back to their defaults, and that mutation wakes the watcher,
   * which writes the default straight back. The key returns holding the
   * default — so "the key is gone" and "the key is empty" stop being
   * different things, which for a token cleared at logout they very much
   * are.
   */
  echo?: boolean
}
const bound = new Map<string, Set<Binding>>()

function share(key: string, binding: Binding) {
  let refs = bound.get(key)
  if (!refs) bound.set(key, refs = new Set())
  refs.add(binding)
  return () => {
    refs.delete(binding)
    if (!refs.size) bound.delete(key)
  }
}

function broadcast(key: string, value: unknown, from: Ref<unknown>) {
  for (const other of bound.get(key) ?? []) {
    if (other.state !== from) other.state.value = value
  }
}

/**
 * Move a ref because storage said so, rather than the other way round.
 *
 * The flag is cleared on the next tick as well as by the watcher, because
 * an incoming value equal to the one already held fires no watcher at all —
 * and a flag left armed would swallow the next genuine write instead.
 */
function applyFromStorage(binding: Binding, value: unknown) {
  binding.echo = true
  binding.state.value = value
  void nextTick(() => { binding.echo = false })
}

function resetAll(key: string) {
  for (const binding of bound.get(key) ?? []) applyFromStorage(binding, binding.fallback)
}

let listening = false

/** Another tab wrote this key — mirror it into every ref bound to it. */
function startTabSync() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('storage', (event) => {
    // A null key is `storage.clear()` — every key at once, so every ref goes
    // back to its default. A logout in another tab looks like this.
    if (event.key == null) {
      for (const key of [...bound.keys()]) resetAll(key)
      return
    }
    const refs = bound.get(event.key)
    if (!refs?.size) return

    // A null value is `removeItem`. There is nothing to mirror, so the refs
    // fall back the same way a fresh load would.
    if (event.newValue == null) {
      resetAll(event.key)
      return
    }

    let next: unknown
    try {
      next = JSON.parse(event.newValue)
    } catch {
      return // another writer put something we cannot read; leave state alone
    }
    for (const binding of refs) applyFromStorage(binding, next)
  })
}

/**
 * Delete a key outright, here and in every other tab.
 *
 * Setting the ref to its default is not the same thing and never was: it
 * leaves the key in storage holding an empty value, so anything that treats
 * "absent" as the signal — a session token, a consent flag — still sees
 * something. This is the delete half of the contract.
 *
 * Refs bound to the key fall back to their own defaults, without writing
 * those defaults back.
 */
export function removeAppStorage(key: string) {
  resolveStorage()?.removeItem(key)
  resetAll(key)
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
    const binding: Binding = { state: state as Ref<unknown>, fallback: defaultValue }
    const release = share(key, binding)
    startTabSync()

    watch(state, (value) => {
      // This change came from storage, not from the app. Writing it back
      // would undo a delete and echo a write that every bound ref already
      // has.
      if (binding.echo) {
        binding.echo = false
        return
      }
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
