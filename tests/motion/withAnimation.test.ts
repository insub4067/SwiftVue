import { describe, it, expect, afterEach, vi } from 'vitest'
import { withAnimation, Animations, registerAnimatable } from '../../src/motion/withAnimation'

// happy-dom does no layout, so getBoundingClientRect is all zeros and
// Element.animate may be absent. Both are stubbed per element: the rects say
// where it was and where it landed, and the animate stub records the call and
// resolves. That lets the FLIP be tested by what it measures and what it
// animates, which is the mechanism; the pixels are a browser's job.
interface AnimateCall { keyframes: unknown, options: unknown }

function movingElement(before: { left: number, top: number }, after: { left: number, top: number }) {
  const el = document.createElement('div')
  document.body.append(el) // so isConnected is true
  const rects = [before, after]
  let i = 0
  el.getBoundingClientRect = (() => (rects[Math.min(i++, 1)]) as DOMRect)
  const calls: AnimateCall[] = []
  el.animate = ((keyframes: unknown, options: unknown) => {
    calls.push({ keyframes, options })
    const anim = { onfinish: null as null | (() => void), oncancel: null as null | (() => void) }
    queueMicrotask(() => anim.onfinish?.())
    return anim as unknown as Animation
  }) as typeof el.animate
  ;(el as unknown as { _calls: AnimateCall[] })._calls = calls
  return el
}

const callsOf = (el: HTMLElement) => (el as unknown as { _calls: AnimateCall[] })._calls
const still = (at: { left: number, top: number }) => movingElement(at, at)

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals() })

describe('Animations', () => {
  it('ships the SwiftUI-named presets', () => {
    for (const name of ['default', 'linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'smooth', 'snappy', 'bouncy'] as const) {
      expect(Animations[name].duration).toBeGreaterThan(0)
      expect(Animations[name].easing).toBeTruthy()
    }
  })
})

describe('withAnimation applies the change', () => {
  it('runs the mutation and resolves its value with nothing to move', async () => {
    let flag = false
    const result = await withAnimation(() => { flag = true; return 42 })
    expect(flag).toBe(true)
    expect(result).toBe(42)
  })

  it('resolves the value even while an element animates', async () => {
    const el = movingElement({ left: 0, top: 0 }, { left: 40, top: 0 })
    const result = await withAnimation(() => 'ok', Animations.spring, { scope: el })
    expect(result).toBe('ok')
  })
})

describe('the FLIP', () => {
  it('animates an element from where it was to where it landed', async () => {
    // moved 30px left and 12px down
    const el = movingElement({ left: 100, top: 200 }, { left: 70, top: 212 })
    await withAnimation(() => {}, Animations.default, { scope: el })

    expect(callsOf(el)).toHaveLength(1)
    const [{ keyframes, options }] = callsOf(el)
    // inverted to the old position first (dx = 100-70 = 30, dy = 200-212 = -12)
    expect((keyframes as Array<{ transform: string }>)[0].transform).toBe('translate(30px, -12px)')
    expect((keyframes as Array<{ transform: string }>)[1].transform).toBe('translate(0px, 0px)')
    expect((options as { duration: number }).duration).toBe(Animations.default.duration)
    expect((options as { easing: string }).easing).toBe(Animations.default.easing)
  })

  it('leaves an element that did not move alone', async () => {
    const el = still({ left: 100, top: 200 })
    await withAnimation(() => {}, Animations.default, { scope: el })
    expect(callsOf(el), 'a zero move is not animated').toHaveLength(0)
  })

  it('moves each element in an array independently', async () => {
    const a = movingElement({ left: 0, top: 0 }, { left: 50, top: 0 })
    const b = still({ left: 0, top: 100 })
    const c = movingElement({ left: 0, top: 200 }, { left: 0, top: 260 })
    await withAnimation(() => {}, Animations.default, { scope: [a, b, c] })
    expect(callsOf(a)).toHaveLength(1)
    expect(callsOf(b), 'unmoved').toHaveLength(0)
    expect(callsOf(c)).toHaveLength(1)
  })

  it('skips a nullish entry, so an unmounted ref is harmless', async () => {
    const el = movingElement({ left: 0, top: 0 }, { left: 20, top: 0 })
    const result = await withAnimation(() => 'ok', Animations.default, { scope: [null, el, undefined] })
    expect(result).toBe('ok')
    expect(callsOf(el)).toHaveLength(1)
  })

  it('skips an element that left the DOM during the mutation', async () => {
    const el = movingElement({ left: 0, top: 0 }, { left: 20, top: 0 })
    await withAnimation(() => { el.remove() }, Animations.default, { scope: el })
    expect(callsOf(el), 'gone, so nothing to move').toHaveLength(0)
  })
})

describe('withAnimation falling back to v-animate markers', () => {
  it('measures every registered element when no scope is given', async () => {
    const a = movingElement({ left: 0, top: 0 }, { left: 30, top: 0 })
    const b = movingElement({ left: 0, top: 50 }, { left: 0, top: 90 })
    const offA = registerAnimatable(a)
    const offB = registerAnimatable(b)

    await withAnimation(() => {})

    expect(callsOf(a)).toHaveLength(1)
    expect(callsOf(b)).toHaveLength(1)
    offA(); offB()
  })

  it('stops measuring an element once its directive is unregistered', async () => {
    const el = movingElement({ left: 0, top: 0 }, { left: 30, top: 0 })
    registerAnimatable(el)()  // register then immediately remove
    await withAnimation(() => {})
    expect(callsOf(el)).toHaveLength(0)
  })

  it('an explicit scope wins over the markers', async () => {
    const marked = movingElement({ left: 0, top: 0 }, { left: 30, top: 0 })
    const chosen = movingElement({ left: 0, top: 0 }, { left: 30, top: 0 })
    const off = registerAnimatable(marked)

    await withAnimation(() => {}, Animations.default, { scope: chosen })

    expect(callsOf(chosen)).toHaveLength(1)
    expect(callsOf(marked), 'left out when a scope is explicit').toHaveLength(0)
    off()
  })

  it('scope: null animates nothing, even with markers present', async () => {
    const marked = movingElement({ left: 0, top: 0 }, { left: 30, top: 0 })
    const off = registerAnimatable(marked)
    await withAnimation(() => {}, Animations.default, { scope: null })
    expect(callsOf(marked)).toHaveLength(0)
    off()
  })
})

// prefers-reduced-motion is an accessibility setting, not a taste: for some
// people the movement is what makes the page unusable. The reduced path is
// not less animation — it is none, and the state change still has to land.
describe('someone who has asked for less motion', () => {
  const prefer = (reduce: boolean) =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))

  it('gets the state change with no movement', async () => {
    prefer(true)
    const el = movingElement({ left: 0, top: 0 }, { left: 40, top: 0 })
    let changed = false
    const result = await withAnimation(() => { changed = true; return 'done' }, Animations.default, { scope: el })
    expect(changed, 'the mutation still applied').toBe(true)
    expect(result).toBe('done')
    expect(callsOf(el), 'but nothing was animated').toHaveLength(0)
  })

  it('and everyone else still gets the movement', async () => {
    prefer(false)
    const el = movingElement({ left: 0, top: 0 }, { left: 40, top: 0 })
    await withAnimation(() => {}, Animations.default, { scope: el })
    expect(callsOf(el)).toHaveLength(1)
  })
})
