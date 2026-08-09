import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAppStorage } from '../../src/composables/useAppStorage'

describe('useAppStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default value when key is not in storage', () => {
    const val = useAppStorage('missing', 'default')
    expect(val.value).toBe('default')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('name', JSON.stringify('stored'))
    const val = useAppStorage('name', 'default')
    expect(val.value).toBe('stored')
  })

  it('persists changes to localStorage', async () => {
    const val = useAppStorage('count', 0)
    val.value = 42
    await nextTick()
    expect(JSON.parse(localStorage.getItem('count')!)).toBe(42)
  })

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('bad', '{invalid json')
    const val = useAppStorage('bad', 'fallback')
    expect(val.value).toBe('fallback')
  })

  it('handles localStorage quota errors gracefully', async () => {
    const val = useAppStorage('key', 'value')
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    val.value = 'new value'
    await nextTick()
    expect(val.value).toBe('new value')
    spy.mockRestore()
  })

  it('handles complex objects', async () => {
    const val = useAppStorage('obj', { a: 1, b: [2, 3] })
    expect(val.value).toEqual({ a: 1, b: [2, 3] })
    val.value.a = 99
    await nextTick()
    expect(JSON.parse(localStorage.getItem('obj')!).a).toBe(99)
  })
})
