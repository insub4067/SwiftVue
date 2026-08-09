import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SVImage from '../../src/components/media/SVImage.vue'
import AsyncImage from '../../src/components/media/AsyncImage.vue'
import Form from '../../src/components/data/Form.vue'
import DatePicker from '../../src/components/controls/DatePicker.vue'
import Menu from '../../src/components/controls/Menu.vue'

describe('Image', () => {
  it('keeps its intrinsic size until made resizable', () => {
    const plain = mount(SVImage, { props: { src: '/a.png', alt: 'A' } })
    expect(plain.element.style.objectFit).toBe('')

    const resizable = mount(SVImage, { props: { src: '/a.png', alt: 'A', resizable: true } })
    expect(resizable.element.style.width).toBe('100%')
  })

  it('fit contains and fill covers', () => {
    const fit = mount(SVImage, { props: { src: '/a.png', resizable: true, contentMode: 'fit' } })
    const fill = mount(SVImage, { props: { src: '/a.png', resizable: true, contentMode: 'fill' } })
    expect(fit.element.style.objectFit).toBe('contain')
    expect(fill.element.style.objectFit).toBe('cover')
  })

  it('an explicit frame wins over the resizable default', () => {
    const wrapper = mount(SVImage, {
      props: { src: '/a.png', resizable: true, frame: { width: 120, height: 80 } },
    })
    expect(wrapper.element.style.width).toBe('120px')
    expect(wrapper.element.style.height).toBe('80px')
  })

  it('an image without alt is decorative, and hidden from assistive tech', () => {
    const described = mount(SVImage, { props: { src: '/a.png', alt: 'A cat' } })
    const decorative = mount(SVImage, { props: { src: '/a.png' } })
    expect(described.attributes('aria-hidden')).toBeUndefined()
    expect(decorative.attributes('aria-hidden')).toBe('true')
    expect(decorative.attributes('alt')).toBe('')
  })
})

describe('AsyncImage', () => {
  it('shows a placeholder until the image loads', async () => {
    const wrapper = mount(AsyncImage, {
      props: { url: '/a.png' },
      slots: { placeholder: '<span class="ph">loading</span>' },
    })
    expect(wrapper.find('.ph').exists()).toBe(true)

    await wrapper.find('img').trigger('load')
    expect(wrapper.find('.ph').exists()).toBe(false)
    expect(wrapper.find('img').isVisible()).toBe(true)
  })

  it('falls back to the error slot when loading fails', async () => {
    const wrapper = mount(AsyncImage, {
      props: { url: '/missing.png' },
      slots: { error: '<span class="err">broken</span>' },
    })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('.err').exists()).toBe(true)
  })

  it('has a default placeholder and failure state', async () => {
    const wrapper = mount(AsyncImage, { props: { url: '/a.png' } })
    expect(wrapper.find('.async-image-spinner').exists()).toBe(true)
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('.async-image-failed').exists()).toBe(true)
  })

  it('returns to loading when the url changes', async () => {
    const wrapper = mount(AsyncImage, { props: { url: '/a.png' } })
    await wrapper.find('img').trigger('load')
    expect(wrapper.find('.async-image-spinner').exists()).toBe(false)

    await wrapper.setProps({ url: '/b.png' })
    expect(wrapper.find('.async-image-spinner').exists()).toBe(true)
  })
})

describe('Form', () => {
  it('renders a real form so Enter submits', () => {
    const wrapper = mount(Form, { slots: { default: '<input />' } })
    expect(wrapper.element.tagName).toBe('FORM')
  })

  it('emits submit instead of navigating', async () => {
    const wrapper = mount(Form)
    await wrapper.trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('spaces its groups like a grouped list', () => {
    expect(mount(Form, { props: { spacing: 12 } }).element.style.gap).toBe('12px')
  })
})

describe('DatePicker', () => {
  it.each([
    ['date', 'date'],
    ['hourAndMinute', 'time'],
    ['dateAndTime', 'datetime-local'],
  ])('%s maps to input type %s', (components, type) => {
    const wrapper = mount(DatePicker, { props: { displayedComponents: components as never } })
    expect(wrapper.attributes('type')).toBe(type)
  })

  it('emits the raw ISO value', async () => {
    const wrapper = mount(DatePicker, { props: { modelValue: '' } })
    await wrapper.setValue('2026-08-09')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-08-09'])
  })

  it('passes min, max and label through', () => {
    const wrapper = mount(DatePicker, {
      props: { min: '2026-01-01', max: '2026-12-31', label: 'Due date' },
    })
    expect(wrapper.attributes('min')).toBe('2026-01-01')
    expect(wrapper.attributes('max')).toBe('2026-12-31')
    expect(wrapper.attributes('aria-label')).toBe('Due date')
  })
})

describe('Menu', () => {
  const actions = [
    { label: 'Rename', id: 'rename' },
    { label: 'Duplicate', id: 'dup', disabled: true },
    { label: 'Delete', id: 'del', role: 'destructive' as const },
  ]
  const open = async () => {
    const wrapper = mount(Menu, { props: { label: 'More', actions }, attachTo: document.body })
    await wrapper.find('.menu-trigger').trigger('click')
    await nextTick()
    return wrapper
  }

  it('starts closed and announces that it opens a menu', () => {
    const wrapper = mount(Menu, { props: { label: 'More', actions } })
    const trigger = wrapper.find('.menu-trigger')
    expect(trigger.attributes('aria-haspopup')).toBe('true')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('opens on click and lists its actions', async () => {
    const wrapper = await open()
    expect(wrapper.find('.menu-trigger').attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(3)
    wrapper.unmount()
  })

  it('selecting an action reports it and closes', async () => {
    const wrapper = await open()
    await wrapper.findAll('[role="menuitem"]')[0].trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([actions[0]])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a disabled action cannot be chosen', async () => {
    const wrapper = await open()
    const disabled = wrapper.findAll('[role="menuitem"]')[1]
    expect(disabled.attributes('disabled')).toBeDefined()
    await disabled.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })

  it('arrow keys move through the enabled items, skipping disabled ones', async () => {
    const wrapper = await open()
    const items = wrapper.findAll('[role="menuitem"]:not([disabled])')
    expect(document.activeElement).toBe(items[0].element)

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1].element)

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement, 'wraps to the top').toBe(items[0].element)
    wrapper.unmount()
  })

  it('Escape closes it', async () => {
    const wrapper = await open()
    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('a pointer press outside closes it', async () => {
    const wrapper = await open()
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('stops listening to the document once unmounted', async () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const wrapper = await open()
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    remove.mockRestore()
  })
})
