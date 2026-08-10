import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAppStorage, removeAppStorage } from '../../src/composables/useAppStorage'

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

// A delete has to stay a delete. Another tab removes a key; this tab's refs
// fall back to their defaults — and that mutation used to wake the watcher,
// which wrote the default straight back. The key came back, holding the
// default, so "the key is gone" and "the key is empty" became the same
// thing. For a token cleared at logout those are not the same thing at all.
describe('a key deleted in another tab stays deleted', () => {
  const fire = (init: StorageEventInit) =>
    window.dispatchEvent(new StorageEvent('storage', init))

  beforeEach(() => localStorage.clear())

  it('removeItem elsewhere does not recreate the key here', async () => {
    const token = useAppStorage('session-token', '')
    token.value = 'secret'
    await nextTick()
    expect(localStorage.getItem('session-token')).toBe('"secret"')

    localStorage.removeItem('session-token')
    fire({ key: 'session-token', newValue: null })
    await nextTick()
    await nextTick()

    expect(token.value, 'the ref falls back').toBe('')
    expect(localStorage.getItem('session-token'), 'and the key is still gone').toBeNull()
  })

  it('clear() elsewhere does not repopulate storage with defaults', async () => {
    const a = useAppStorage('cleared-one', 'default-a')
    const b = useAppStorage('cleared-two', 'default-b')
    a.value = 'written-a'
    b.value = 'written-b'
    await nextTick()

    localStorage.clear()
    fire({ key: null, newValue: null })
    await nextTick()
    await nextTick()

    expect(a.value).toBe('default-a')
    expect(b.value).toBe('default-b')
    expect(localStorage.length, 'storage is empty, not full of defaults').toBe(0)
  })

  // The suppression must last exactly one mutation. A ref that stopped
  // persisting after a cross-tab delete would be worse than the bug.
  it('and the next local write persists as usual', async () => {
    const token = useAppStorage('write-after-delete', '')
    localStorage.removeItem('write-after-delete')
    fire({ key: 'write-after-delete', newValue: null })
    await nextTick()
    await nextTick()

    token.value = 'written again'
    await nextTick()
    expect(localStorage.getItem('write-after-delete')).toBe('"written again"')
  })

  // Applying a value that happens to equal the current one fires no watcher
  // at all, so a flag armed for it would sit there and swallow a real write.
  it('an external write of the value it already had does not arm anything', async () => {
    const state = useAppStorage('same-value', 'x')
    fire({ key: 'same-value', newValue: JSON.stringify('x') })
    await nextTick()
    await nextTick()

    state.value = 'y'
    await nextTick()
    expect(localStorage.getItem('same-value')).toBe('"y"')
  })
})

// Setting a ref to its default is not deleting. It leaves the key in
// storage holding an empty value, so anything reading "is this key absent"
// — a session token, a consent flag — still finds something there.
describe('removeAppStorage deletes rather than blanks', () => {
  beforeEach(() => localStorage.clear())

  it('takes the key out of storage and falls the refs back', async () => {
    const token = useAppStorage('logout-token', '')
    token.value = 'secret'
    await nextTick()

    removeAppStorage('logout-token')
    await nextTick()
    await nextTick()

    expect(token.value).toBe('')
    expect(localStorage.getItem('logout-token'), 'absent, not empty').toBeNull()
  })

  it('every ref on the key falls back, not just the one you have', async () => {
    const one = useAppStorage('shared-key', 'fallback')
    const two = useAppStorage('shared-key', 'fallback')
    one.value = 'written'
    await nextTick()
    expect(two.value).toBe('written')

    removeAppStorage('shared-key')
    await nextTick()
    expect(two.value).toBe('fallback')
  })

  it('and writing afterwards recreates the key', async () => {
    const token = useAppStorage('recreate-me', '')
    removeAppStorage('recreate-me')
    await nextTick()
    await nextTick()

    token.value = 'new session'
    await nextTick()
    expect(localStorage.getItem('recreate-me')).toBe('"new session"')
  })
})
