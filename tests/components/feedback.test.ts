import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressView from '../../src/components/feedback/ProgressView.vue'

describe('ProgressView', () => {
  it('renders circular by default', () => {
    const wrapper = mount(ProgressView)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders linear when specified', () => {
    const wrapper = mount(ProgressView, { props: { progressViewStyle: 'linear' } })
    expect(wrapper.find('.track').exists()).toBe(true)
  })

  it('has progressbar role', () => {
    const wrapper = mount(ProgressView)
    expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
  })

  it('shows indeterminate state when no value', () => {
    const wrapper = mount(ProgressView)
    expect(wrapper.find('svg .spin').exists() || wrapper.find('.spin').exists()).toBe(true)
  })

  it('shows determinate state with value', () => {
    const wrapper = mount(ProgressView, { props: { value: 50, total: 100 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('50')
  })

  it('renders slot content as label', () => {
    const wrapper = mount(ProgressView, {
      props: { progressViewStyle: 'linear' },
      slots: { default: 'Loading...' },
    })
    expect(wrapper.text()).toContain('Loading...')
  })
})
