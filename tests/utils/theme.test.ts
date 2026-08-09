import { describe, it, expect } from 'vitest'
import { resolveColor, resolveFont, SwiftColors, SwiftFonts } from '../../src/utils/theme'

describe('resolveColor', () => {
  it('resolves named colors to CSS variables', () => {
    expect(resolveColor('primary')).toBe('var(--swift-primary)')
    expect(resolveColor('red')).toBe('var(--swift-red)')
    expect(resolveColor('background')).toBe('var(--swift-background)')
  })

  it('returns raw color values when not a named color', () => {
    expect(resolveColor('#FF0000')).toBe('#FF0000')
    expect(resolveColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)')
    expect(resolveColor('transparent')).toBe('transparent')
  })

  it('handles built-in literal colors', () => {
    expect(resolveColor('white')).toBe('#FFFFFF')
    expect(resolveColor('black')).toBe('#000000')
    expect(resolveColor('clear')).toBe('transparent')
  })
})

describe('resolveFont', () => {
  it('resolves known font styles', () => {
    const body = resolveFont('body')
    expect(body.size).toBe('17px')
    expect(body.weight).toBe('400')
    expect(body.lineHeight).toBe('22px')
  })

  it('resolves largeTitle correctly', () => {
    const lt = resolveFont('largeTitle')
    expect(lt.size).toBe('34px')
    expect(lt.weight).toBe('700')
  })

  it('falls back to body for unknown fonts', () => {
    const unknown = resolveFont('notAFont' as any)
    expect(unknown).toEqual(SwiftFonts.body)
  })
})
