import { ref, watch, type Ref } from 'vue'

export type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'swift-color-scheme'

// The scheme is a property of the document, so every caller shares one state.
let shared: Ref<ColorScheme | null> | null = null

function readStored(): ColorScheme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function apply(value: ColorScheme | null) {
  const root = document.documentElement
  root.classList.toggle('swift-dark', value === 'dark')
  root.classList.toggle('swift-light', value === 'light')
  // keeps form controls, scrollbars and the UA canvas in step
  root.style.colorScheme = value ?? ''
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — the classes still apply for this session
  }
}

/**
 * SwiftUI's `.preferredColorScheme(_:)`.
 *
 * Returns a writable ref: `'dark'` and `'light'` force a scheme,
 * `null` follows the system. The choice persists across sessions.
 *
 * ```ts
 * const scheme = usePreferredColorScheme()
 * scheme.value = 'dark'   // force dark
 * scheme.value = null     // back to system
 * ```
 */
export function usePreferredColorScheme(): Ref<ColorScheme | null> {
  if (shared) return shared

  // During SSR there is no document to drive — hand back inert state.
  if (typeof document === 'undefined') {
    shared = ref<ColorScheme | null>(null)
    return shared
  }

  shared = ref<ColorScheme | null>(readStored())
  watch(shared, apply, { immediate: true })
  return shared
}

/** Test hook: drops the shared state so each test starts clean. @internal */
export function __resetPreferredColorScheme() {
  shared = null
}
