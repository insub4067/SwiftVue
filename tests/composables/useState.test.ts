import { describe, it, expect } from 'vitest'
import { isRef } from 'vue'
import { useState } from '../../src/composables/useState'

describe('useState', () => {
  it('returns a ref with the initial value', () => {
    const count = useState(42)
    expect(isRef(count)).toBe(true)
    expect(count.value).toBe(42)
  })

  it('is reactive', () => {
    const name = useState('hello')
    name.value = 'world'
    expect(name.value).toBe('world')
  })

  it('handles object values', () => {
    const state = useState({ a: 1, b: 'test' })
    expect(state.value).toEqual({ a: 1, b: 'test' })
    state.value.a = 2
    expect(state.value.a).toBe(2)
  })

  it('handles array values', () => {
    const list = useState([1, 2, 3])
    expect(list.value).toEqual([1, 2, 3])
    list.value.push(4)
    expect(list.value).toHaveLength(4)
  })
})
