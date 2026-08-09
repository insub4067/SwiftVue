import { describe, it, expect } from 'vitest'
import { buildModifierStyle } from '../../src/utils/modifiers'

describe('buildModifierStyle', () => {
  it('returns empty object for no props', () => {
    expect(buildModifierStyle({})).toEqual({})
  })

  it('handles number padding', () => {
    const style = buildModifierStyle({ padding: 16 })
    expect(style.padding).toBe('16px')
  })

  it('handles 2-value padding array', () => {
    const style = buildModifierStyle({ padding: [8, 16] })
    expect(style.padding).toBe('8px 16px')
  })

  it('handles 4-value padding array', () => {
    const style = buildModifierStyle({ padding: [1, 2, 3, 4] })
    expect(style.padding).toBe('1px 2px 3px 4px')
  })

  it('handles horizontal/vertical padding', () => {
    const style = buildModifierStyle({ paddingHorizontal: 10, paddingVertical: 20 })
    expect(style.paddingLeft).toBe('10px')
    expect(style.paddingRight).toBe('10px')
    expect(style.paddingTop).toBe('20px')
    expect(style.paddingBottom).toBe('20px')
  })

  it('handles frame modifier', () => {
    const style = buildModifierStyle({
      frame: { width: 100, height: '50%', maxWidth: 400 },
    })
    expect(style.width).toBe('100px')
    expect(style.height).toBe('50%')
    expect(style.maxWidth).toBe('400px')
  })

  it('resolves named background colors', () => {
    const style = buildModifierStyle({ background: 'primary' })
    expect(style.backgroundColor).toBe('var(--swift-primary)')
  })

  it('handles raw CSS background colors', () => {
    const style = buildModifierStyle({ background: '#FF0000' })
    expect(style.backgroundColor).toBe('#FF0000')
  })

  it('applies foregroundColor', () => {
    const style = buildModifierStyle({ foregroundColor: 'red' })
    expect(style.color).toBe('var(--swift-red)')
  })

  it('applies font style', () => {
    const style = buildModifierStyle({ font: 'title' })
    expect(style.fontSize).toBe('28px')
    expect(style.fontWeight).toBe('700')
  })

  it('applies fontWeight override', () => {
    const style = buildModifierStyle({ font: 'body', fontWeight: 'bold' })
    expect(style.fontWeight).toBe('700')
  })

  it('applies cornerRadius', () => {
    const style = buildModifierStyle({ cornerRadius: 12 })
    expect(style.borderRadius).toBe('12px')
  })

  it('applies shadow', () => {
    const style = buildModifierStyle({ shadow: { radius: 4, x: 1, y: 2 } })
    expect(style.boxShadow).toBe('1px 2px 8px rgba(0,0,0,0.15)')
  })

  it('applies opacity', () => {
    const style = buildModifierStyle({ opacity: 0.5 })
    expect(style.opacity).toBe(0.5)
  })

  it('applies border', () => {
    const style = buildModifierStyle({ border: { color: 'red', width: 2 } })
    expect(style.border).toBe('2px solid var(--swift-red)')
  })

  it('applies hidden', () => {
    const style = buildModifierStyle({ hidden: true })
    expect(style.display).toBe('none')
  })

  it('applies clipShape circle', () => {
    const style = buildModifierStyle({ clipShape: 'circle' })
    expect(style.borderRadius).toBe('50%')
  })

  it('applies clipShape capsule', () => {
    const style = buildModifierStyle({ clipShape: 'capsule' })
    expect(style.borderRadius).toBe('9999px')
  })

  it('applies zIndex', () => {
    const style = buildModifierStyle({ zIndex: 10 })
    expect(style.zIndex).toBe(10)
  })
})
