import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick, reactive } from 'vue'
import { onChange } from '../../src/composables/onChange'

describe('onChange', () => {
  it('fires with new and old values when the source changes', async () => {
    const volume = ref(50)
    const spy = vi.fn()
    onChange(volume, spy)

    volume.value = 80
    await nextTick()
    expect(spy).toHaveBeenCalledExactlyOnceWith(80, 50)
  })

  it('does not fire for the initial value by default', async () => {
    const spy = vi.fn()
    onChange(ref('a'), spy)
    await nextTick()
    expect(spy).not.toHaveBeenCalled()
  })

  it('initial: true fires once immediately, like onChange(of:initial:)', () => {
    const name = ref('swift')
    const spy = vi.fn()
    onChange(name, spy, { initial: true })
    expect(spy).toHaveBeenCalledExactlyOnceWith('swift', undefined)
  })

  it('deep: true observes nested mutation', async () => {
    const user = ref({ profile: { name: 'a' } })
    const spy = vi.fn()
    onChange(user, spy, { deep: true })

    user.value.profile.name = 'b'
    await nextTick()
    expect(spy).toHaveBeenCalledOnce()
  })

  it('accepts a getter source and the handle stops it', async () => {
    const state = reactive({ count: 0 })
    const spy = vi.fn()
    const stop = onChange(() => state.count, spy)

    state.count = 1
    await nextTick()
    expect(spy).toHaveBeenCalledOnce()

    stop()
    state.count = 2
    await nextTick()
    expect(spy).toHaveBeenCalledOnce()
  })
})
