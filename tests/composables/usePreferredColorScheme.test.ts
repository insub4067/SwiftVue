import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import {
  usePreferredColorScheme,
  __resetPreferredColorScheme,
} from '../../src/composables/usePreferredColorScheme'

const root = () => document.documentElement

beforeEach(() => {
  __resetPreferredColorScheme()
  localStorage.clear()
  root().classList.remove('swift-dark', 'swift-light')
  root().style.colorScheme = ''
})

describe('usePreferredColorScheme', () => {
  it('follows the system by default: no class, no override', () => {
    const scheme = usePreferredColorScheme()
    expect(scheme.value).toBeNull()
    expect(root().classList.contains('swift-dark')).toBe(false)
    expect(root().classList.contains('swift-light')).toBe(false)
  })

  it('forcing dark stamps the class and color-scheme', async () => {
    const scheme = usePreferredColorScheme()
    scheme.value = 'dark'
    await nextTick()
    expect(root().classList.contains('swift-dark')).toBe(true)
    expect(root().classList.contains('swift-light')).toBe(false)
    expect(root().style.colorScheme).toBe('dark')
  })

  it('forcing light beats a dark OS via the swift-light class', async () => {
    const scheme = usePreferredColorScheme()
    scheme.value = 'light'
    await nextTick()
    // the media-query block is guarded with :root:not(.swift-light)
    expect(root().classList.contains('swift-light')).toBe(true)
    expect(root().classList.contains('swift-dark')).toBe(false)
  })

  it('returning to system removes both classes and the stored choice', async () => {
    const scheme = usePreferredColorScheme()
    scheme.value = 'dark'
    await nextTick()
    scheme.value = null
    await nextTick()
    expect(root().classList.contains('swift-dark')).toBe(false)
    expect(root().classList.contains('swift-light')).toBe(false)
    expect(localStorage.getItem('swift-color-scheme')).toBeNull()
  })

  it('persists the choice and restores it on the next session', async () => {
    const first = usePreferredColorScheme()
    first.value = 'dark'
    await nextTick()
    expect(localStorage.getItem('swift-color-scheme')).toBe('dark')

    __resetPreferredColorScheme() // simulate a fresh page load
    const second = usePreferredColorScheme()
    expect(second.value).toBe('dark')
  })

  it('every caller shares one state', () => {
    const a = usePreferredColorScheme()
    const b = usePreferredColorScheme()
    a.value = 'dark'
    expect(b.value).toBe('dark')
  })

  it('ignores garbage in storage', () => {
    localStorage.setItem('swift-color-scheme', 'sepia')
    expect(usePreferredColorScheme().value).toBeNull()
  })
})
