import { describe, it, expect, afterEach, vi } from 'vitest'
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

// Without a scope the API snapshots the whole page and cross-fades it, which
// flashes even when a single card changed. A scope names the changing element
// so it is lifted out of the page snapshot and the rest of the screen holds
// still. These tests pin the naming: present during the transition, unique,
// and cleaned up after — a leaked `view-transition-name` would freeze that
// element out of every later transition.
describe('withAnimation({ scope })', () => {
  // The name has to exist when the OLD snapshot is taken — before
  // startViewTransition — and still be there through the mutation, or the
  // element is a different box on each side and cross-fades instead of
  // morphing. The mock records what the element carried at each moment.
  function recordingTransition(watch: () => string) {
    const seen: Record<string, string> = {}
    doc.startViewTransition = (update) => {
      seen.atStart = watch()
      const finished = update().then(() => { seen.afterMutate = watch() })
      return { finished }
    }
    return seen
  }

  it('names the scoped element for the duration, then takes the name back', async () => {
    const el = document.createElement('div')
    const seen = recordingTransition(() => el.style.getPropertyValue('view-transition-name'))

    await withAnimation(() => {}, Animations.default, { scope: el })

    expect(seen.atStart, 'named before the old snapshot').toBeTruthy()
    expect(seen.afterMutate, 'still named while the new snapshot is taken').toBe(seen.atStart)
    expect(el.style.getPropertyValue('view-transition-name'),
      'and released once the animation settled').toBe('')
  })

  it('gives two elements distinct names, since a duplicate rejects the transition', async () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    let names: string[] = []
    doc.startViewTransition = (update) => {
      names = [a, b].map(el => el.style.getPropertyValue('view-transition-name'))
      return { finished: update() }
    }

    await withAnimation(() => {}, Animations.default, { scope: [a, b] })

    expect(names[0]).toBeTruthy()
    expect(names[1]).toBeTruthy()
    expect(names[0], 'two scoped elements must not share a name').not.toBe(names[1])
  })

  it('restores a name the element already had rather than deleting it', async () => {
    const el = document.createElement('div')
    el.style.setProperty('view-transition-name', 'hero')
    doc.startViewTransition = (update) => ({ finished: update() })

    await withAnimation(() => {}, Animations.default, { scope: el })

    expect(el.style.getPropertyValue('view-transition-name'),
      'a caller who named it keeps their name').toBe('hero')
  })

  it('skips a nullish entry, so an unmounted ref is harmless', async () => {
    const el = document.createElement('div')
    let count = -1
    doc.startViewTransition = (update) => {
      // one named element among the nulls
      count = [null, el, undefined].filter(
        (e): e is HTMLElement => e instanceof HTMLElement && !!e.style.getPropertyValue('view-transition-name'),
      ).length
      return { finished: update() }
    }

    await expect(
      withAnimation(() => 'ok', Animations.default, { scope: [null, el, undefined] }),
    ).resolves.toBe('ok')
    expect(count).toBe(1)
  })

  it('names nothing when no scope is given', async () => {
    const el = document.createElement('div')
    document.body.append(el)
    doc.startViewTransition = (update) => ({ finished: update() })

    await withAnimation(() => {})

    expect(el.style.getPropertyValue('view-transition-name')).toBe('')
    el.remove()
  })
})

// Setting prefers-reduced-motion is an accessibility setting, not a
// preference about polish: for some people the animation is what makes the
// page unusable. So the reduced path is not "less animation" — it is none,
// and the state change still has to land.
describe('someone who has asked for less motion', () => {
  const prefer = (reduce: boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))

  afterEach(() => vi.unstubAllGlobals())

  it('gets the state change without the animation', async () => {
    const calls: string[] = []
    doc.startViewTransition = (update) => {
      calls.push('start')
      return { finished: update() }
    }
    prefer(true)

    const result = await withAnimation(() => { calls.push('mutate'); return 'done' })

    expect(calls, 'the view transition was never started').toEqual(['mutate'])
    expect(result, 'and the mutation still applied').toBe('done')
  })

  it('and the animation is left alone for everyone else', async () => {
    const calls: string[] = []
    doc.startViewTransition = (update) => {
      calls.push('start')
      return { finished: update() }
    }
    prefer(false)

    await withAnimation(() => calls.push('mutate'))
    expect(calls).toEqual(['start', 'mutate'])
  })
})
