import { describe, it, expect, afterEach } from 'vitest'
import { withAnimation, Animations } from '../../src/motion/withAnimation'

type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }

const doc = document as VTDocument

afterEach(() => {
  delete doc.startViewTransition
  document.documentElement.style.removeProperty('--swift-vt-duration')
  document.documentElement.style.removeProperty('--swift-vt-easing')
})

describe('Animations', () => {
  it('ships the SwiftUI-named presets', () => {
    for (const name of ['default', 'linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'smooth', 'snappy', 'bouncy'] as const) {
      expect(Animations[name].duration).toBeGreaterThan(0)
      expect(Animations[name].easing).toBeTruthy()
    }
  })
})

describe('withAnimation', () => {
  it('applies the mutation and resolves its value without view-transition support', async () => {
    // happy-dom has no startViewTransition — this IS the fallback path
    expect(doc.startViewTransition).toBeUndefined()
    let flag = false
    const result = await withAnimation(() => { flag = true; return 42 })
    expect(flag).toBe(true)
    expect(result).toBe(42)
  })

  it('drives the View Transitions API when available', async () => {
    const calls: string[] = []
    doc.startViewTransition = (update) => {
      calls.push('start')
      const finished = update().then(() => { calls.push('updated') })
      return { finished }
    }

    const result = await withAnimation(() => { calls.push('mutate'); return 'ok' }, Animations.spring)

    expect(calls).toEqual(['start', 'mutate', 'updated'])
    expect(result).toBe('ok')
    const style = document.documentElement.style
    expect(style.getPropertyValue('--swift-vt-duration')).toBe('500ms')
    expect(style.getPropertyValue('--swift-vt-easing')).toContain('cubic-bezier')
  })

  it('still resolves the value when the transition is skipped', async () => {
    doc.startViewTransition = (update) => {
      void update()
      return { finished: Promise.reject(new Error('skipped')) }
    }
    const result = await withAnimation(() => 7)
    expect(result).toBe(7)
  })
})
