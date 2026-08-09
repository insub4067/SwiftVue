import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import VStack from '../../src/components/layout/VStack.vue'
import HStack from '../../src/components/layout/HStack.vue'
import ZStack from '../../src/components/layout/ZStack.vue'
import Spacer from '../../src/components/layout/Spacer.vue'
import Divider from '../../src/components/layout/Divider.vue'
import ScrollView from '../../src/components/layout/ScrollView.vue'
import LazyVGrid from '../../src/components/layout/LazyVGrid.vue'
import LazyHGrid from '../../src/components/layout/LazyHGrid.vue'

describe('VStack', () => {
  it('renders slot content', () => {
    const wrapper = mount(VStack, { slots: { default: '<span>Child</span>' } })
    expect(wrapper.text()).toBe('Child')
  })

  it('applies flex column layout', () => {
    const wrapper = mount(VStack)
    expect(wrapper.element.style.flexDirection).toBe('column')
    expect(wrapper.element.style.display).toBe('flex')
  })

  it('uses spacing prop', () => {
    const wrapper = mount(VStack, { props: { spacing: 20 } })
    expect(wrapper.element.style.gap).toBe('20px')
  })

  it('defaults to center alignment', () => {
    const wrapper = mount(VStack)
    expect(wrapper.element.style.alignItems).toBe('center')
  })

  it('applies leading alignment', () => {
    const wrapper = mount(VStack, { props: { alignment: 'leading' } })
    expect(wrapper.element.style.alignItems).toBe('flex-start')
  })
})

describe('HStack', () => {
  it('renders with flex row layout', () => {
    const wrapper = mount(HStack)
    expect(wrapper.element.style.flexDirection).toBe('row')
  })

  it('uses spacing prop', () => {
    const wrapper = mount(HStack, { props: { spacing: 12 } })
    expect(wrapper.element.style.gap).toBe('12px')
  })

  it('applies bottom alignment', () => {
    const wrapper = mount(HStack, { props: { alignment: 'bottom' } })
    expect(wrapper.element.style.alignItems).toBe('flex-end')
  })

  it('stays on one line by default', () => {
    expect(mount(HStack).element.style.flexWrap).toBe('')
  })

  it('flows onto more lines when wrap is set', () => {
    expect(mount(HStack, { props: { wrap: true } }).element.style.flexWrap).toBe('wrap')
  })
})

describe('ZStack', () => {
  it('renders with grid layout', () => {
    const wrapper = mount(ZStack)
    expect(wrapper.element.style.display).toBe('grid')
  })

  it('has relative position', () => {
    const wrapper = mount(ZStack)
    expect(wrapper.element.style.position).toBe('relative')
  })
})

describe('Spacer', () => {
  it('has flex-grow 1', () => {
    const wrapper = mount(Spacer)
    expect(wrapper.element.style.flexGrow).toBe('1')
  })

  it('applies minLength', () => {
    const wrapper = mount(Spacer, { props: { minLength: 20 } })
    expect(wrapper.element.style.minWidth).toBe('20px')
    expect(wrapper.element.style.minHeight).toBe('20px')
  })
})

describe('Divider', () => {
  it('renders as hr', () => {
    const wrapper = mount(Divider)
    expect(wrapper.element.tagName).toBe('HR')
  })

  it('applies default thickness', () => {
    const wrapper = mount(Divider)
    expect(wrapper.element.style.height).toBe('1px')
  })

  it('applies custom thickness and color', () => {
    const wrapper = mount(Divider, { props: { thickness: 3, color: '#000' } })
    expect(wrapper.element.style.height).toBe('3px')
    expect(wrapper.element.style.backgroundColor).toBe('#000')
  })
})

describe('ScrollView', () => {
  it('renders slot content', () => {
    const wrapper = mount(ScrollView, { slots: { default: '<span>Content</span>' } })
    expect(wrapper.text()).toBe('Content')
  })

  it('scrolls vertically by default', () => {
    const wrapper = mount(ScrollView)
    expect(wrapper.element.style.overflowY).toBe('auto')
    expect(wrapper.element.style.overflowX).toBe('hidden')
  })

  it('scrolls horizontally when axes is horizontal', () => {
    const wrapper = mount(ScrollView, { props: { axes: 'horizontal' } })
    expect(wrapper.element.style.overflowX).toBe('auto')
    expect(wrapper.element.style.overflowY).toBe('hidden')
  })

  it('scrolls both axes when axes is both', () => {
    const wrapper = mount(ScrollView, { props: { axes: 'both' } })
    expect(wrapper.element.style.overflowX).toBe('auto')
    expect(wrapper.element.style.overflowY).toBe('auto')
  })

  // Regression: a horizontal scroller left at width:auto resolves to its
  // content width, so it inflates its ancestors and has nothing to scroll.
  it('takes its width from the parent when scrolling horizontally', () => {
    expect(mount(ScrollView, { props: { axes: 'horizontal' } }).element.style.width).toBe('100%')
    expect(mount(ScrollView, { props: { axes: 'both' } }).element.style.width).toBe('100%')
  })

  it('leaves width alone when only scrolling vertically', () => {
    const wrapper = mount(ScrollView, { props: { axes: 'vertical' } })
    expect(wrapper.element.style.width).toBe('')
  })

  it('lets an explicit frame width win over the parent-width default', () => {
    const wrapper = mount(ScrollView, {
      props: { axes: 'horizontal', frame: { width: 320 } },
    })
    expect(wrapper.element.style.width).toBe('320px')
  })

  it('drops the automatic minimum so content can overflow', () => {
    const wrapper = mount(ScrollView, { props: { axes: 'horizontal' } })
    // Serialized as '0' or '0px' depending on the DOM impl; both mean zero.
    expect(parseFloat(wrapper.element.style.minWidth)).toBe(0)
  })

  it('lets an explicit frame minWidth win', () => {
    const wrapper = mount(ScrollView, {
      props: { axes: 'horizontal', frame: { minWidth: 200 } },
    })
    expect(wrapper.element.style.minWidth).toBe('200px')
  })

  it('shows scroll indicators by default', () => {
    const wrapper = mount(ScrollView)
    expect(wrapper.classes()).not.toContain('hide-scrollbar')
  })

  it('hides scroll indicators when showsIndicators is false', () => {
    const wrapper = mount(ScrollView, { props: { showsIndicators: false } })
    expect(wrapper.classes()).toContain('hide-scrollbar')
  })

  it('still applies modifier props', () => {
    const wrapper = mount(ScrollView, {
      props: { axes: 'horizontal', frame: { height: 100 }, padding: 16 },
    })
    expect(wrapper.element.style.height).toBe('100px')
    expect(wrapper.element.style.padding).toBe('16px')
  })
})

describe('ScrollView refreshable', () => {
  it('renders no refresh zone without the prop', () => {
    expect(mount(ScrollView).find('.swift-refresh').exists()).toBe(false)
  })

  it('refresh() runs the handler and holds the spinner until it settles', async () => {
    let release!: () => void
    const handler = vi.fn(() => new Promise<void>(r => { release = r }))
    const wrapper = mount(ScrollView, { props: { refreshable: handler } })

    const pending = (wrapper.vm as unknown as { refresh: () => Promise<void> }).refresh()
    await nextTick()
    expect(handler).toHaveBeenCalledOnce()
    expect(wrapper.find('.swift-refresh-spinner').classes()).toContain('spinning')
    expect(wrapper.find('.swift-refresh').element.getAttribute('style')).toContain('height: 52px')

    release()
    await pending
    await nextTick()
    expect(wrapper.find('.swift-refresh-spinner').classes()).not.toContain('spinning')
    expect(wrapper.find('.swift-refresh').element.getAttribute('style')).toContain('height: 0px')
  })

  it('does not start a second refresh while one is running', async () => {
    let release!: () => void
    const handler = vi.fn(() => new Promise<void>(r => { release = r }))
    const wrapper = mount(ScrollView, { props: { refreshable: handler } })
    const vm = wrapper.vm as unknown as { refresh: () => Promise<void> }

    const first = vm.refresh()
    await nextTick()
    await vm.refresh() // ignored — already refreshing
    expect(handler).toHaveBeenCalledOnce()

    release()
    await first
  })

  it('spinner clears even when the handler rejects', async () => {
    const handler = vi.fn(() => Promise.reject(new Error('offline')))
    const wrapper = mount(ScrollView, { props: { refreshable: handler } })
    const vm = wrapper.vm as unknown as { refresh: () => Promise<void> }

    await expect(vm.refresh()).rejects.toThrow('offline')
    await nextTick()
    expect(wrapper.find('.swift-refresh-spinner').classes()).not.toContain('spinning')
  })
})

describe('LazyVGrid', () => {
  it('renders slot content in a grid', () => {
    const wrapper = mount(LazyVGrid, { slots: { default: '<span>Cell</span>' } })
    expect(wrapper.element.style.display).toBe('grid')
    expect(wrapper.text()).toBe('Cell')
  })

  it('accepts a column count', () => {
    const wrapper = mount(LazyVGrid, { props: { columns: 3 } })
    expect(wrapper.element.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
  })

  it('accepts a GridItem array', () => {
    const wrapper = mount(LazyVGrid, {
      props: { columns: [{ fixed: 80 }, { flexible: {} }] },
    })
    expect(wrapper.element.style.gridTemplateColumns).toBe('80px minmax(0, 1fr)')
  })

  it('applies spacing as gap', () => {
    const wrapper = mount(LazyVGrid, { props: { spacing: 20 } })
    expect(wrapper.element.style.gap).toBe('20px')
  })

  it('maps alignment onto justifyItems', () => {
    expect(mount(LazyVGrid).element.style.justifyItems).toBe('center')
    expect(mount(LazyVGrid, { props: { alignment: 'leading' } }).element.style.justifyItems).toBe('start')
    expect(mount(LazyVGrid, { props: { alignment: 'trailing' } }).element.style.justifyItems).toBe('end')
  })

  // Sizing to its own content would inflate ancestors and leave adaptive
  // tracks nothing to measure against — the ScrollView bug in grid form.
  it('spans the available width by default', () => {
    expect(mount(LazyVGrid).element.style.width).toBe('100%')
    expect(parseFloat(mount(LazyVGrid).element.style.minWidth)).toBe(0)
  })

  it('lets an explicit frame width win', () => {
    const wrapper = mount(LazyVGrid, { props: { frame: { width: 300 } } })
    expect(wrapper.element.style.width).toBe('300px')
  })

  it('still applies modifier props', () => {
    const wrapper = mount(LazyVGrid, { props: { padding: 12, cornerRadius: 8 } })
    expect(wrapper.element.style.padding).toBe('12px')
    expect(wrapper.element.style.borderRadius).toBe('8px')
  })
})

describe('LazyHGrid', () => {
  it('renders slot content in a grid', () => {
    const wrapper = mount(LazyHGrid, { slots: { default: '<span>Cell</span>' } })
    expect(wrapper.element.style.display).toBe('grid')
    expect(wrapper.text()).toBe('Cell')
  })

  it('lays rows out and flows into new columns', () => {
    const wrapper = mount(LazyHGrid, { props: { rows: 2 } })
    expect(wrapper.element.style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))')
    expect(wrapper.element.style.gridAutoFlow).toBe('column')
  })

  it('accepts a GridItem array for rows', () => {
    const wrapper = mount(LazyHGrid, { props: { rows: [{ fixed: 60 }, { adaptive: 40 }] } })
    expect(wrapper.element.style.gridTemplateRows)
      .toBe('60px repeat(auto-fill, minmax(40px, 1fr))')
  })

  it('maps alignment onto alignItems', () => {
    expect(mount(LazyHGrid).element.style.alignItems).toBe('center')
    expect(mount(LazyHGrid, { props: { alignment: 'top' } }).element.style.alignItems).toBe('start')
    expect(mount(LazyHGrid, { props: { alignment: 'bottom' } }).element.style.alignItems).toBe('end')
  })

  // It is meant to sit inside a horizontal ScrollView, so it must be free to
  // grow past the viewport rather than being pinned to the parent width.
  it('does not force a width', () => {
    expect(mount(LazyHGrid).element.style.width).toBe('')
  })
})
