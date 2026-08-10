// NavigationSplitView is the one component whose whole job depends on how
// wide the window is, so every test here says which width it is standing at.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import NavigationSplitView from '../../src/components/navigation/NavigationSplitView.vue'

type Listener = (e: { matches: boolean }) => void

/**
 * A window of a given width, and a handle to resize it.
 *
 * happy-dom has no layout, so `matchMedia` is stubbed rather than measured —
 * which is honest about what this suite can and cannot see. That the two
 * columns actually sit side by side at 1024px is a question only a browser
 * can answer, and `e2e/kitchen.spec.ts` asks it there.
 */
function windowOf(width: number) {
  const listeners = new Set<Listener>()
  let current = width
  vi.stubGlobal('matchMedia', (queryText: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(queryText)?.[1] ?? 0)
    return {
      get matches() { return current >= min },
      media: queryText,
      addEventListener: (_: string, fn: Listener) => listeners.add(fn),
      removeEventListener: (_: string, fn: Listener) => listeners.delete(fn),
    }
  })
  return {
    async resizeTo(next: number, breakpoint = 768) {
      current = next
      for (const fn of listeners) fn({ matches: next >= breakpoint })
      await nextTick()
    },
  }
}

const mountSplit = (props: Record<string, unknown> = {}) => mount(NavigationSplitView, {
  props,
  slots: {
    sidebar: () => h('button', { class: 'menu-item' }, 'Inbox'),
    detail: () => h('p', { class: 'detail' }, 'A message'),
  },
  attachTo: document.body,
})

afterEach(() => vi.unstubAllGlobals())

describe('on an iPad, the sidebar is a column', () => {
  it('shows both columns without being asked', async () => {
    windowOf(1024)
    const wrapper = mountSplit()
    await flushPromises()

    expect(wrapper.find('.menu-item').exists()).toBe(true)
    expect(wrapper.find('.detail').exists()).toBe(true)
    expect(wrapper.find('aside').attributes('aria-hidden')).toBeUndefined()
    wrapper.unmount()
  })

  it('takes the width it was given', async () => {
    windowOf(1024)
    const wrapper = mountSplit({ sidebarWidth: 260 })
    await flushPromises()

    const aside = wrapper.find('aside').element as HTMLElement
    expect(aside.style.width).toBe('260px')
    expect(aside.style.flex, 'a flex item would otherwise shrink to its content')
      .toContain('260px')
    wrapper.unmount()
  })

  // Nothing is over anything, so there is nothing to dim and nothing to trap.
  it('has no scrim beside a column', async () => {
    windowOf(1024)
    const wrapper = mountSplit()
    await flushPromises()
    expect(wrapper.find('.swift-split-scrim').exists()).toBe(false)
    wrapper.unmount()
  })

  it('detailOnly slides it out by its own width rather than unmounting it', async () => {
    windowOf(1024)
    const wrapper = mountSplit({ columnVisibility: 'detailOnly', sidebarWidth: 300 })
    await flushPromises()

    const aside = wrapper.find('aside')
    // Kept in the DOM so the menu holds its scroll position and any typing
    // across a toggle — but out of the reading order while it is away.
    expect(aside.exists()).toBe(true)
    expect((aside.element as HTMLElement).style.marginInlineStart).toBe('-300px')
    expect(aside.attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })
})

describe('on a phone, the sidebar is an overlay', () => {
  it('stays out of the way until asked for', async () => {
    windowOf(390)
    const wrapper = mountSplit()
    await flushPromises()

    expect(wrapper.find('aside').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.swift-split-scrim').exists()).toBe(false)
    wrapper.unmount()
  })

  it('comes over the detail, with a scrim', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn' })
    await flushPromises()

    expect(wrapper.find('.swift-split-scrim').exists()).toBe(true)
    expect((wrapper.find('aside').element as HTMLElement).style.position).toBe('absolute')
    wrapper.unmount()
  })

  it('the scrim shuts it', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn' })
    await flushPromises()

    await wrapper.find('.swift-split-scrim').trigger('click')
    expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual(['detailOnly'])
    wrapper.unmount()
  })

  it('so does Escape', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn' })
    await flushPromises()

    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual(['detailOnly'])
    wrapper.unmount()
  })

  // A column is part of the page; Escape closing it would be a surprise.
  it('but Escape leaves a column alone', async () => {
    windowOf(1024)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn' })
    await flushPromises()

    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update:columnVisibility')).toBeUndefined()
    wrapper.unmount()
  })

  it('takes the keyboard while it is over the content', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn' })
    await flushPromises()

    expect(document.activeElement).toBe(wrapper.find('.menu-item').element)
    wrapper.unmount()
  })

  it('and gives it back when it closes', async () => {
    windowOf(390)
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mountSplit({ columnVisibility: 'detailOnly' })
    await flushPromises()
    await wrapper.setProps({ columnVisibility: 'doubleColumn' })
    await flushPromises()
    await wrapper.setProps({ columnVisibility: 'detailOnly' })
    await flushPromises()

    expect(document.activeElement).toBe(opener)
    opener.remove()
    wrapper.unmount()
  })
})

describe('automatic follows the width', () => {
  it('open on an iPad, shut on a phone, without the app saying so', async () => {
    const win = windowOf(1024)
    const wrapper = mountSplit()
    await flushPromises()
    expect(wrapper.find('aside').attributes('aria-hidden')).toBeUndefined()

    await win.resizeTo(390)
    expect(wrapper.find('aside').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  // A rotation is not the app changing its mind. Writing the resolved value
  // back to the model would make one look like the other.
  it('a resize does not write to the model', async () => {
    const win = windowOf(1024)
    const wrapper = mountSplit()
    await flushPromises()

    await win.resizeTo(390)
    await win.resizeTo(1024)

    expect(wrapper.emitted('update:columnVisibility')).toBeUndefined()
    wrapper.unmount()
  })

  it('an explicit choice outranks the width', async () => {
    const win = windowOf(1024)
    const wrapper = mountSplit({ columnVisibility: 'detailOnly' })
    await flushPromises()
    expect(wrapper.find('aside').attributes('aria-hidden')).toBe('true')

    await win.resizeTo(390)
    expect(wrapper.find('aside').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })
})

describe('the toggle', () => {
  it('is drawn when the sidebar cannot be reached any other way', async () => {
    windowOf(390)
    const wrapper = mountSplit()
    await flushPromises()

    const toggle = wrapper.find('.swift-split-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBe(wrapper.find('aside').attributes('id'))
    wrapper.unmount()
  })

  it('is left out when the sidebar is already a visible column', async () => {
    windowOf(1024)
    const wrapper = mountSplit()
    await flushPromises()
    expect(wrapper.find('.swift-split-toggle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('but appears once that column is put away', async () => {
    windowOf(1024)
    const wrapper = mountSplit({ columnVisibility: 'detailOnly' })
    await flushPromises()
    expect(wrapper.find('.swift-split-toggle').exists()).toBe(true)
    wrapper.unmount()
  })

  it('gives way to a toolbar of your own', async () => {
    windowOf(390)
    const wrapper = mountSplit({ hidesToggle: true })
    await flushPromises()
    expect(wrapper.find('.swift-split-toggle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens and shuts', async () => {
    windowOf(390)
    const wrapper = mountSplit()
    await flushPromises()

    await wrapper.find('.swift-split-toggle').trigger('click')
    expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual(['doubleColumn'])

    await wrapper.setProps({ columnVisibility: 'doubleColumn' })
    await flushPromises()
    await wrapper.find('.swift-split-toggle').trigger('click')
    expect(wrapper.emitted('update:columnVisibility')?.at(-1)).toEqual(['detailOnly'])
    wrapper.unmount()
  })
})

describe('right to left', () => {
  // happy-dom does not resolve an inherited `direction`, so the reading is
  // stubbed — the same way every other RTL test here does it. `isRTL` says
  // in its own comment that it falls back where there is no layout to ask.
  const reading = (direction: 'rtl' | 'ltr') =>
    vi.spyOn(globalThis, 'getComputedStyle')
      .mockReturnValue({ direction } as CSSStyleDeclaration)

  it('slides the overlay out towards the trailing edge', async () => {
    windowOf(390)
    const spy = reading('rtl')
    const wrapper = mountSplit({ columnVisibility: 'detailOnly' })
    await flushPromises()

    // The inset is logical and mirrors itself; `translateX` is physical and
    // has to be turned round by hand, or the sidebar hides on the wrong side.
    expect((wrapper.find('aside').element as HTMLElement).style.transform)
      .toBe('translateX(100%)')

    spy.mockRestore()
    wrapper.unmount()
  })

  it('and towards the leading edge left to right', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'detailOnly' })
    await flushPromises()
    expect((wrapper.find('aside').element as HTMLElement).style.transform)
      .toBe('translateX(-100%)')
    wrapper.unmount()
  })
})

describe('hidden outranks everything', () => {
  it('a hidden split view shows no sidebar and no scrim', async () => {
    windowOf(390)
    const wrapper = mountSplit({ columnVisibility: 'doubleColumn', hidden: true })
    await flushPromises()

    expect(wrapper.find('.swift-split-scrim').exists()).toBe(false)
    expect((wrapper.element as HTMLElement).style.display).toBe('none')
    wrapper.unmount()
  })
})

describe('without matchMedia', () => {
  // Server-rendered, or an old enough browser. Guessing "phone" would hide
  // the menu on the very first paint of a desktop page.
  it('assumes the roomy layout rather than the cramped one', async () => {
    vi.stubGlobal('matchMedia', undefined)
    const wrapper = mountSplit()
    await flushPromises()

    expect(wrapper.find('aside').attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.find('.swift-split-scrim').exists()).toBe(false)
    wrapper.unmount()
  })
})
