import { beforeEach } from 'vitest'

/**
 * Node 22.4+ defines an experimental global `localStorage` getter that yields
 * `undefined` unless the process was started with --localstorage-file. Because
 * happy-dom shares `window` with `globalThis`, that getter wins and every
 * storage-backed test breaks on newer runtimes (13 of them on Node 26).
 *
 * Install a Web Storage implementation the tests own, so the suite behaves
 * the same on every Node version.
 */
class MemoryStorage implements Storage {
  #entries = new Map<string, string>()

  get length() { return this.#entries.size }
  key(index: number) { return [...this.#entries.keys()][index] ?? null }
  getItem(key: string) { return this.#entries.get(String(key)) ?? null }
  setItem(key: string, value: string) { this.#entries.set(String(key), String(value)) }
  removeItem(key: string) { this.#entries.delete(String(key)) }
  clear() { this.#entries.clear() }
  [name: string]: unknown
}

function usable(storage: unknown): storage is Storage {
  try {
    const s = storage as Storage | undefined
    if (!s || typeof s.setItem !== 'function') return false
    s.setItem('__swiftvue_probe__', '1')
    s.removeItem('__swiftvue_probe__')
    return true
  } catch {
    return false
  }
}

if (!usable(globalThis.localStorage)) {
  const storage = new MemoryStorage()
  for (const target of new Set([globalThis, globalThis.window].filter(Boolean))) {
    Object.defineProperty(target, 'localStorage', {
      configurable: true,
      writable: true,
      value: storage,
    })
  }
}

beforeEach(() => {
  localStorage.clear()
})
