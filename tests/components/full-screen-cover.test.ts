// FullScreenCover is teleported to the body, so nothing here reaches for it
// through the wrapper — the wrapper's tree does not contain it.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import FullScreenCover from '../../src/components/navigation/FullScreenCover.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'

const cover = () => document.querySelector<HTMLElement>('.swift-cover')

const mountCover = (props: Record<string, unknown> = {}, slot = '<button class="close">Done</button>') =>
  mount(FullScreenCover, {
    props: { isPresented: true, ...props },
    slots: { default: slot },
    attachTo: document.body,
  })

beforeEach(() => {
  document.body.style.overflow = ''
  // A teleported node inside a <Transition> is removed when its leave
  // transition ends, and happy-dom never fires `transitionend` — so an
  // unmounted cover lingers, and `cover()` would hand back a dead element
  // whose listeners are gone. Real browsers do fire it; this is the
  // environment, not the component.
  for (const stale of document.querySelectorAll('.swift-cover, .sheet-overlay')) stale.remove()
})

describe('a cover replaces the screen', () => {
  it('is a modal dialog with the name it was given', async () => {
    const wrapper = mountCover({ label: 'Compose' })
    await flushPromises()

    expect(cover()?.getAttribute('role')).toBe('dialog')
    expect(cover()?.getAttribute('aria-modal')).toBe('true')
    expect(cover()?.getAttribute('aria-label')).toBe('Compose')
    wrapper.unmount()
  })

  // The difference from a Sheet, in one assertion. A sheet is a card over a
  // page you can still see; a cover is the page.
  it('fills the viewport rather than sitting on it', async () => {
    const wrapper = mountCover()
    await flushPromises()

    const style = cover()!.style
    expect(style.position).toBe('fixed')
    expect(style.inset, 'edge to edge').toBe('0')
    wrapper.unmount()
  })

  it('has no backdrop to reach past', async () => {
    const wrapper = mountCover()
    await flushPromises()
    expect(document.querySelector('.sheet-overlay')).toBeNull()
    wrapper.unmount()
  })

  it('renders nothing at all while it is down', async () => {
    const wrapper = mountCover({ isPresented: false })
    await flushPromises()
    expect(cover()).toBeNull()
    wrapper.unmount()
  })

  it('hidden outranks isPresented, as everywhere else', async () => {
    const wrapper = mountCover({ hidden: true })
    await flushPromises()
    expect(cover()).toBeNull()
    wrapper.unmount()
  })
})

describe('the way out', () => {
  // SwiftUI has no Escape and no dismiss gesture on a cover — you provide
  // the button. On the web a modal that takes the keyboard and offers no way
  // back is a keyboard trap, so Escape is the floor beneath whatever button
  // the app draws.
  it('Escape closes it', async () => {
    const wrapper = mountCover()
    await flushPromises()

    cover()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:isPresented')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('Escape works even with nothing focusable inside', async () => {
    const wrapper = mountCover({}, '<p>Nothing to press</p>')
    await flushPromises()

    // Focus lands on the cover itself, so the handler hears the key at all.
    expect(document.activeElement).toBe(cover())
    cover()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('update:isPresented')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })

  it('a click inside does not close it — there is no backdrop', async () => {
    const wrapper = mountCover()
    await flushPromises()

    cover()!.click()
    await flushPromises()
    expect(wrapper.emitted('update:isPresented')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('the keyboard stays inside', () => {
  const both = '<button class="first">One</button><button class="last">Two</button>'

  it('takes focus when it comes up', async () => {
    const wrapper = mountCover({}, both)
    await flushPromises()
    expect(document.activeElement).toBe(document.querySelector('.first'))
    wrapper.unmount()
  })

  it('Tab wraps from the last back to the first', async () => {
    const wrapper = mountCover({}, both)
    await flushPromises()

    document.querySelector<HTMLElement>('.last')!.focus()
    cover()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
    await flushPromises()

    expect(document.activeElement).toBe(document.querySelector('.first'))
    wrapper.unmount()
  })

  it('Shift+Tab wraps from the first back to the last', async () => {
    const wrapper = mountCover({}, both)
    await flushPromises()

    document.querySelector<HTMLElement>('.first')!.focus()
    cover()!.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
    }))
    await flushPromises()

    expect(document.activeElement).toBe(document.querySelector('.last'))
    wrapper.unmount()
  })

  it('Tab cannot leave a cover with nothing in it', async () => {
    const wrapper = mountCover({}, '<p>Nothing</p>')
    await flushPromises()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    cover()!.dispatchEvent(event)
    expect(event.defaultPrevented, 'out is behind the cover').toBe(true)
    wrapper.unmount()
  })

  it('gives focus back to whatever raised it', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mountCover({ isPresented: false })
    await flushPromises()
    await wrapper.setProps({ isPresented: true })
    await flushPromises()
    await wrapper.setProps({ isPresented: false })
    await flushPromises()

    expect(document.activeElement).toBe(opener)
    opener.remove()
    wrapper.unmount()
  })
})

describe('the page underneath', () => {
  it('stops scrolling while the cover is up, and starts again after', async () => {
    const wrapper = mountCover({ isPresented: false })
    await flushPromises()

    await wrapper.setProps({ isPresented: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ isPresented: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })

  it('unmounting while up does not leave the page frozen', async () => {
    const wrapper = mountCover()
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
  })

  // Two overlays, one lock. Whichever gives it back first must restore what
  // was there rather than assume the page was scrollable.
  it('a cover over a sheet gives the lock back to the sheet, not to nobody', async () => {
    const sheet = mount(Sheet, { props: { isPresented: true }, attachTo: document.body })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')

    const wrapper = mountCover()
    await flushPromises()
    wrapper.unmount()
    await flushPromises()

    expect(document.body.style.overflow, 'the sheet is still up').toBe('hidden')
    sheet.unmount()
    await flushPromises()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('it is not a Sheet', () => {
  it('a Sheet dismisses on its backdrop; a cover has none to dismiss from', async () => {
    const sheet = mount(Sheet, {
      props: { isPresented: true },
      slots: { default: () => h('p', 'card') },
      attachTo: document.body,
    })
    await flushPromises()

    const overlay = document.querySelector<HTMLElement>('.sheet-overlay')!
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(sheet.emitted('update:isPresented')?.at(-1), 'the sheet went').toEqual([false])
    sheet.unmount()

    const wrapper = mountCover()
    await flushPromises()
    cover()!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update:isPresented'), 'the cover stayed').toBeUndefined()
    wrapper.unmount()
  })
})

describe('nothing about a cover warns', () => {
  it('raising and lowering one is silent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountCover({ isPresented: false })
    await flushPromises()
    await wrapper.setProps({ isPresented: true })
    await flushPromises()
    wrapper.unmount()
    await flushPromises()

    expect(warn.mock.calls.flat().join('\n')).toBe('')
    expect(error.mock.calls.flat().join('\n')).toBe('')
    warn.mockRestore()
    error.mockRestore()
  })
})
