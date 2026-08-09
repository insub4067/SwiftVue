import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, Transition } from 'vue'
import TransitionView from '../../src/components/motion/TransitionView.vue'

function mountWith(props: Record<string, unknown> = {}, show = true) {
  return mount(TransitionView, {
    props,
    slots: { default: () => (show ? h('div', { id: 'x' }, 'content') : null) },
  })
}

describe('TransitionView', () => {
  it('renders the slot content', () => {
    const wrapper = mountWith()
    expect(wrapper.find('#x').exists()).toBe(true)
    expect(wrapper.text()).toBe('content')
  })

  it('defaults to the opacity preset', () => {
    const t = mountWith().getComponent(Transition)
    expect(t.props('enterFromClass')).toBe('swift-t-opacity-in')
    expect(t.props('leaveToClass')).toBe('swift-t-opacity-out')
    expect(t.props('enterActiveClass')).toBe('swift-t-active')
  })

  it('maps every preset onto its class pair', () => {
    for (const preset of ['opacity', 'scale', 'slide', 'moveTop', 'moveBottom', 'moveLeading', 'moveTrailing']) {
      const t = mountWith({ transition: preset }).getComponent(Transition)
      expect(t.props('enterFromClass')).toBe(`swift-t-${preset}-in`)
      expect(t.props('leaveToClass')).toBe(`swift-t-${preset}-out`)
    }
  })

  it('supports asymmetric insertion/removal like .asymmetric', () => {
    const t = mountWith({ insertion: 'moveBottom', removal: 'opacity' }).getComponent(Transition)
    expect(t.props('enterFromClass')).toBe('swift-t-moveBottom-in')
    expect(t.props('leaveToClass')).toBe('swift-t-opacity-out')
  })

  it('passes the mode through for view swaps', () => {
    const t = mountWith({ mode: 'out-in' }).getComponent(Transition)
    expect(t.props('mode')).toBe('out-in')
  })
})
