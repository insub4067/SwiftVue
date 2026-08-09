import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import SwipeActions from '../../src/components/data/SwipeActions.vue'
import Toggle from '../../src/components/controls/Toggle.vue'

// happy-dom rewrites import.meta.url to a non-file scheme, so resolve
// against the project root instead.
const SRC = resolve(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(vue|css)$/.test(entry.name) ? [path] : []
  })
}

/**
 * `leading` and `trailing` are direction words. Writing them as `left` and
 * `right` works until the page is Arabic or Hebrew, and then every one of
 * them is backwards. This is a lint rule with nowhere else to live: the
 * physical property is only wrong when a logical one would have done.
 */
describe('nothing hard-codes a physical direction', () => {
  const BANNED = [
    /(^|[^-\w])margin-left\s*:/,
    /(^|[^-\w])margin-right\s*:/,
    /(^|[^-\w])padding-left\s*:/,
    /(^|[^-\w])padding-right\s*:/,
    /(^|[^-\w])border-left\s*:/,
    /(^|[^-\w])border-right\s*:/,
    /text-align\s*:\s*(left|right)/,
  ]

  // A menu opens at the pointer, which is a physical place — there is no
  // logical property for "where the finger was".
  const ALLOWED = new Set(['ContextMenu.vue'])

  it.each(sourceFiles(SRC).map(f => [f.slice(SRC.length + 1), f]))('%s', (name, path) => {
    if (ALLOWED.has(name.split('/').pop()!)) return
    const source = readFileSync(path, 'utf8')
    for (const banned of BANNED) {
      const line = source.split('\n').find(l => banned.test(l) && !l.includes('inset'))
      expect(line, `use the logical property instead: ${line}`).toBeUndefined()
    }
  })
})

// A gesture cannot be written in logical properties the way CSS can, so the
// mirroring has to be done by hand — and therefore tested.
describe('gestures mirror in a right-to-left layout', () => {
  const rtl = (value: 'rtl' | 'ltr') =>
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ direction: value } as CSSStyleDeclaration)

  const swipe = (el: Element, from: number, to: number) => {
    const at = (x: number, type: string) =>
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: 40, pointerId: 1 }))
    at(from, 'pointerdown')
    at(to, 'pointermove')
    at(to, 'pointerup')
  }

  it('back swipes in from the right edge', async () => {
    const spy = rtl('rtl')
    const wrapper = mount(NavigationStack, { props: { title: 'Home' }, attachTo: document.body })
    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await nextTick()

    // happy-dom reports a zero-size box, so both edges sit at 0 — starting
    // there is "on the right edge" only under rtl.
    swipe(wrapper.element, 0, -120)
    await nextTick()
    expect(wrapper.vm.depth, 'travelled inwards, which is leftwards here').toBe(0)

    spy.mockRestore()
    wrapper.unmount()
  })

  it('and the same gesture does nothing left to right', async () => {
    const spy = rtl('ltr')
    const wrapper = mount(NavigationStack, { props: { title: 'Home' }, attachTo: document.body })
    wrapper.vm.push({ title: 'Detail', content: () => h('p', 'detail') })
    await nextTick()

    swipe(wrapper.element, 0, -120)
    await nextTick()
    expect(wrapper.vm.depth, 'leftwards is away from the leading edge').toBe(1)

    spy.mockRestore()
    wrapper.unmount()
  })

  it('a row opens its trailing actions towards the trailing edge', async () => {
    const spy = rtl('rtl')
    const wrapper = mount(SwipeActions, {
      props: { trailing: [{ label: 'Delete' }] },
      slots: { default: '<p>Row</p>' },
      attachTo: document.body,
    })
    await nextTick()

    // rightwards, which is towards the trailing edge in a right-to-left row
    swipe(wrapper.element, 300, 420)
    await nextTick()

    const transform = wrapper.find('.swipe-content').attributes('style')
    expect(transform, 'the row slides right to uncover the left-hand slab')
      .toContain('translateX(84px)')
    spy.mockRestore()
    wrapper.unmount()
  })
})

describe('the Toggle knob travels along the inline axis', () => {
  const knob = (on: boolean) => {
    const wrapper = mount(Toggle, { props: { modelValue: on } })
    return wrapper.element.firstElementChild!.getAttribute('style') ?? ''
  }

  it.each([[false, '2px'], [true, '22px']])('modelValue=%s puts it at %s', (on, at) => {
    expect(knob(on)).toContain(`inset-inline-start: ${at}`)
  })
})
