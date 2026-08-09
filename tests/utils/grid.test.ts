import { describe, it, expect } from 'vitest'
import { resolveTracks } from '../../src/utils/grid'

describe('resolveTracks', () => {
  it('expands a count into equal tracks', () => {
    expect(resolveTracks(3)).toBe('repeat(3, minmax(0, 1fr))')
  })

  // A bare `1fr` floors at min-content, so a wide child pushes the grid past
  // its container instead of the track shrinking.
  it('floors flexible tracks at zero so they can shrink', () => {
    expect(resolveTracks(2)).toContain('minmax(0, 1fr)')
    expect(resolveTracks([{ flexible: {} }])).toBe('minmax(0, 1fr)')
  })

  it('clamps a count to at least one track', () => {
    // repeat(0, …) is invalid CSS and would drop the declaration entirely.
    expect(resolveTracks(0)).toBe('repeat(1, minmax(0, 1fr))')
    expect(resolveTracks(-2)).toBe('repeat(1, minmax(0, 1fr))')
  })

  it('rounds a fractional count down', () => {
    expect(resolveTracks(2.7)).toBe('repeat(2, minmax(0, 1fr))')
  })

  it('falls back to a single flexible track for an empty spec', () => {
    expect(resolveTracks([])).toBe('minmax(0, 1fr)')
  })

  it('renders fixed tracks', () => {
    expect(resolveTracks([{ fixed: 120 }])).toBe('120px')
    expect(resolveTracks([{ fixed: '10rem' }])).toBe('10rem')
  })

  it('renders flexible tracks with bounds', () => {
    expect(resolveTracks([{ flexible: { minimum: 50 } }])).toBe('minmax(50px, 1fr)')
    expect(resolveTracks([{ flexible: { maximum: 200 } }])).toBe('minmax(0, 200px)')
    expect(resolveTracks([{ flexible: { minimum: 50, maximum: 200 } }])).toBe('minmax(50px, 200px)')
  })

  it('renders adaptive tracks as auto-fill', () => {
    expect(resolveTracks([{ adaptive: 100 }])).toBe('repeat(auto-fill, minmax(100px, 1fr))')
    expect(resolveTracks([{ adaptive: { minimum: 100 } }])).toBe('repeat(auto-fill, minmax(100px, 1fr))')
    expect(resolveTracks([{ adaptive: { minimum: 100, maximum: 150 } }]))
      .toBe('repeat(auto-fill, minmax(100px, 150px))')
  })

  it('joins a mixed spec in order', () => {
    expect(resolveTracks([{ fixed: 80 }, { flexible: {} }, { fixed: 40 }]))
      .toBe('80px minmax(0, 1fr) 40px')
  })

  it('treats an item with no size as flexible', () => {
    expect(resolveTracks([{}, { fixed: 50 }])).toBe('minmax(0, 1fr) 50px')
  })
})
