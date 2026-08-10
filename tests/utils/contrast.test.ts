// Contrast, measured rather than assumed.
//
// The theme is Apple's iOS system palette, and a good deal of it does not
// reach WCAG AA for normal-sized text — `systemBlue` on white is 4.02:1
// against a 4.5:1 bar, and white on `systemBlue` is the same figure, which
// means a filled blue button with white text fails. That is Apple's
// tradeoff, not a mistake in the port, and changing the numbers would make
// SwiftVue stop looking like the thing it exists to look like.
//
// So this test does not demand AA. It pins every ratio to what it is today
// and fails if any of them gets worse, which turns an unmeasured risk into
// a tracked number — and gives `docs/SUPPORT.md` figures to publish instead
// of an apology.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/styles/swift.css'), 'utf8')

function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(selector)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const out: Record<string, string> = {}
  for (const line of css.slice(open, close).split('\n')) {
    const match = /--(swift-[a-z-]+):\s*(#[0-9A-Fa-f]+)/.exec(line)
    if (match) out[match[1]] = match[2]
  }
  return out
}

type RGBA = [number, number, number, number]

function parse(hex: string): RGBA | null {
  const h = hex.slice(1)
  const at = (i: number) => parseInt(h.slice(i, i + 2), 16)
  if (h.length === 6) return [at(0), at(2), at(4), 1]
  // iOS label colours carry their alpha in the hex, and a translucent grey
  // over white is a different colour from the same grey over black.
  if (h.length === 8) return [at(0), at(2), at(4), at(6) / 255]
  return null
}

const flatten = (fg: RGBA, bg: RGBA): [number, number, number] =>
  [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])) as [number, number, number]

function luminance([r, g, b]: [number, number, number]) {
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(fg: RGBA, bg: RGBA) {
  const [hi, lo] = [luminance(flatten(fg, bg)), luminance([bg[0], bg[1], bg[2]])]
    .sort((a, b) => b - a)
  return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2))
}

const light = tokens(':root {')
const dark = tokens(':root.swift-dark')

const contrast = (theme: Record<string, string>, fg: string, bg: string) =>
  ratio(parse(theme[fg])!, parse(theme[bg])!)

describe('the palette is what it is, and stays that way', () => {
  // Recorded, not aspired to. A change that improves one of these should
  // update the number deliberately; a change that worsens one should have
  // to argue for itself in a diff.
  const LIGHT: [string, string, number][] = [
    ['swift-label', 'swift-background', 21],
    ['swift-secondary-label', 'swift-background', 3.44],
    ['swift-tertiary-label', 'swift-background', 1.74],
    ['swift-primary', 'swift-background', 4.02],
    ['swift-red', 'swift-background', 3.55],
    ['swift-green', 'swift-background', 2.22],
    ['swift-secondary-label', 'swift-secondary-background', 3.30],
  ]

  it.each(LIGHT)('light: %s on %s', (fg, bg, expected) => {
    expect(contrast(light, fg, bg)).toBe(expected)
  })

  const DARK: [string, string, number][] = [
    ['swift-label', 'swift-background', 21],
    ['swift-secondary-label', 'swift-background', 6.36],
    ['swift-tertiary-label', 'swift-background', 2.27],
    ['swift-primary', 'swift-background', 5.76],
  ]

  it.each(DARK)('dark: %s on %s', (fg, bg, expected) => {
    expect(contrast(dark, fg, bg)).toBe(expected)
  })
})

describe('what the numbers mean', () => {
  const AA_NORMAL = 4.5
  const AA_LARGE = 3

  // The headline: body text on the page background clears the bar in both
  // themes. If that ever stopped being true it would be a defect rather
  // than a tradeoff.
  it('primary label text reaches AA in both themes', () => {
    expect(contrast(light, 'swift-label', 'swift-background')).toBeGreaterThanOrEqual(AA_NORMAL)
    expect(contrast(dark, 'swift-label', 'swift-background')).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  // Named rather than hidden. These are the pairs a consumer has to know
  // about, and SUPPORT.md lists them for exactly this reason.
  it('secondary label is large-text-only in the light theme', () => {
    const r = contrast(light, 'swift-secondary-label', 'swift-background')
    expect(r).toBeGreaterThanOrEqual(AA_LARGE)
    expect(r, 'below AA for normal text — footnotes in this colour are a choice').toBeLessThan(AA_NORMAL)
  })

  it('tertiary label is decorative, not text', () => {
    expect(contrast(light, 'swift-tertiary-label', 'swift-background')).toBeLessThan(AA_LARGE)
    expect(contrast(dark, 'swift-tertiary-label', 'swift-background')).toBeLessThan(AA_LARGE)
  })

  // A filled blue button with white text is the single most common thing
  // anyone will build with this library, and it does not reach AA.
  it('white on the accent colour falls short of AA for normal text', () => {
    const white: RGBA = [255, 255, 255, 1]
    const r = ratio(white, parse(light['swift-primary'])!)
    expect(r).toBeGreaterThanOrEqual(AA_LARGE)
    expect(r, 'Apple ships this; SwiftVue reproduces it').toBeLessThan(AA_NORMAL)
  })
})
