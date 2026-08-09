import { describe, it, expect } from 'vitest'
import { ref, isRef } from 'vue'
import { useBinding, bindRef } from '../../src/composables/useBinding'

describe('useBinding', () => {
  it('reads from getter', () => {
    const source = ref(10)
    const binding = useBinding(
      () => source.value,
      (v) => { source.value = v },
    )
    expect(binding.value).toBe(10)
  })

  it('writes through setter', () => {
    const source = ref('hello')
    const binding = useBinding(
      () => source.value,
      (v) => { source.value = v },
    )
    binding.value = 'world'
    expect(source.value).toBe('world')
  })

  it('stays in sync with source', () => {
    const source = ref(0)
    const binding = useBinding(
      () => source.value * 2,
      (v) => { source.value = v / 2 },
    )
    expect(binding.value).toBe(0)
    source.value = 5
    expect(binding.value).toBe(10)
    binding.value = 20
    expect(source.value).toBe(10)
  })
})

describe('bindRef', () => {
  it('creates a writable computed from a ref', () => {
    const source = ref(42)
    const binding = bindRef(source)
    expect(isRef(binding)).toBe(true)
    expect(binding.value).toBe(42)
  })

  it('two-way syncs with source ref', () => {
    const source = ref('a')
    const binding = bindRef(source)
    binding.value = 'b'
    expect(source.value).toBe('b')
    source.value = 'c'
    expect(binding.value).toBe('c')
  })
})
