import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Alert from '../../src/components/feedback/SVAlert.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'

/**
 * The focus trap and Escape handling on both overlays — the least covered
 * code in the library, and the code a keyboard user depends on entirely. A
 * modal that cannot be closed without a mouse is a trap in the literal sense.
 *
 * Every key here is sent to `document.activeElement`, because that is where
 * the browser sends it. Dispatching straight at the dialog is what let the
 * two bugs below sit undetected.
 */
const press = (key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  document.activeElement!.dispatchEvent(event)
  return event
}

const settle = async () => { await nextTick(); await nextTick() }

// Both overlays teleport to body, so they are never in the wrapper's tree.
const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)]
const one = (selector: string) => document.querySelector<HTMLElement>(selector)!

describe('Alert keyboard', () => {
  const actions = [
    { label: 'Cancel', role: 'cancel' as const },
    { label: 'Delete', role: 'destructive' as const },
  ]
  const open = async (props: Record<string, unknown> = {}) => {
    const wrapper = mount(Alert, {
      props: { isPresented: true, title: 'Heads up', actions, ...props },
      attachTo: document.body,
    })
    await settle()
    return wrapper
  }

  it('takes focus when it opens', async () => {
    const wrapper = await open()
    expect((document.activeElement as HTMLElement).textContent).toBe('Cancel')
    wrapper.unmount()
  })

  it('Escape runs the cancel action', async () => {
    const wrapper = await open()
    press('Escape')
    expect(wrapper.emitted('action')?.[0]).toEqual(['Cancel'])
    expect(wrapper.emitted('update:isPresented')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('with no cancel action, Escape takes the last one', async () => {
    const wrapper = await open({ actions: [{ label: 'OK' }, { label: 'Later' }] })
    press('Escape')
    expect(wrapper.emitted('action')?.[0]).toEqual(['Later'])
    wrapper.unmount()
  })

  // Reaching for the last of an empty list read `.label` off undefined and
  // took the whole app down.
  it('an alert with no actions closes instead of throwing', async () => {
    const wrapper = await open({ actions: [] })
    expect(() => press('Escape')).not.toThrow()
    expect(wrapper.emitted('action')).toBeUndefined()
    expect(wrapper.emitted('update:isPresented')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('Escape is consumed, not passed on to the page', async () => {
    const wrapper = await open()
    expect(press('Escape').defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('Tab wraps from the last button back to the first', async () => {
    const wrapper = await open();
    all('.alert-btn').at(-1)!.focus()

    const event = press('Tab')
    expect(event.defaultPrevented).toBe(true)
    expect((document.activeElement as HTMLElement).textContent).toBe('Cancel')
    wrapper.unmount()
  })

  it('Shift+Tab wraps from the first back to the last', async () => {
    const wrapper = await open()
    const event = press('Tab', { shiftKey: true })
    expect(event.defaultPrevented).toBe(true)
    expect((document.activeElement as HTMLElement).textContent).toBe('Delete')
    wrapper.unmount()
  })

  it('Tab in the middle of the list is left to the browser', async () => {
    const wrapper = await open({ actions: [...actions, { label: 'Third' }] });
    all('.alert-btn')[1].focus()
    expect(press('Tab').defaultPrevented).toBe(false)
    wrapper.unmount()
  })

  it('gives focus back to whatever had it', async () => {
    const before = document.createElement('button')
    document.body.appendChild(before)
    before.focus()

    const wrapper = mount(Alert, {
      props: { isPresented: false, title: 'Heads up', actions },
      attachTo: document.body,
    })
    await wrapper.setProps({ isPresented: true })
    await settle()
    await wrapper.setProps({ isPresented: false })

    expect(document.activeElement).toBe(before)
    wrapper.unmount()
    before.remove()
  })
})

describe('Sheet keyboard', () => {
  const open = async (slot: string) => {
    const wrapper = mount(Sheet, {
      props: { isPresented: true },
      slots: { default: slot },
      attachTo: document.body,
    })
    await settle()
    return wrapper
  }

  it('takes focus when it opens', async () => {
    const wrapper = await open('<button id="a">A</button>')
    expect((document.activeElement as HTMLElement).id).toBe('a')
    wrapper.unmount()
  })

  // The bug: with nothing to focus, focus stayed outside the sheet, so the
  // key never reached the overlay and the sheet could not be closed at all
  // without a pointer.
  it('a sheet with nothing focusable still closes on Escape', async () => {
    const wrapper = await open('<p>Just text</p>')
    press('Escape')
    await nextTick()

    expect(wrapper.emitted('update:isPresented')?.[0]).toEqual([false])
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('Escape closes one with content too', async () => {
    const wrapper = await open('<button id="a">A</button>')
    expect(press('Escape').defaultPrevented).toBe(true)
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('Tab wraps around the content', async () => {
    const wrapper = await open('<button id="a">A</button><button id="b">B</button>');
    (document.getElementById('b') as HTMLElement).focus()

    expect(press('Tab').defaultPrevented).toBe(true)
    expect((document.activeElement as HTMLElement).id).toBe('a')

    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(true)
    expect((document.activeElement as HTMLElement).id).toBe('b')
    wrapper.unmount()
  })

  // Nothing to move to, so Tab must not carry focus out to the page behind.
  it('Tab cannot escape a sheet with nothing focusable', async () => {
    const wrapper = await open('<p>Just text</p>')
    expect(press('Tab').defaultPrevented).toBe(true)
    wrapper.unmount()
  })

  it('gives focus back on close', async () => {
    const before = document.createElement('button')
    document.body.appendChild(before)
    before.focus()

    const wrapper = mount(Sheet, {
      props: { isPresented: false },
      slots: { default: '<button id="a">A</button>' },
      attachTo: document.body,
    })
    await wrapper.setProps({ isPresented: true })
    await settle()
    await wrapper.setProps({ isPresented: false })

    expect(document.activeElement).toBe(before)
    wrapper.unmount()
    before.remove()
  })

  it('a click on the backdrop dismisses, one inside does not', async () => {
    const wrapper = await open('<button id="a">A</button>')
    one('.sheet-container').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('dismiss'), 'a click inside is not a dismissal').toBeUndefined()

    one('.sheet-overlay').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('a medium detent is half height, a large one nearly full', () => {
    const height = (detents: string[]) => {
      const wrapper = mount(Sheet, {
        props: { isPresented: true, detents: detents as never },
        attachTo: document.body,
      })
      const style = one('.sheet-container').getAttribute('style') ?? ''
      wrapper.unmount()
      return style
    }

    expect(height(['medium'])).toContain('max-height: 50%')
    expect(height(['large'])).toContain('max-height: 92%')
  })
})
