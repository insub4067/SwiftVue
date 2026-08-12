import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, type Component } from 'vue'

import HStack from '../../src/components/layout/HStack.vue'
import VStack from '../../src/components/layout/VStack.vue'
import ZStack from '../../src/components/layout/ZStack.vue'
import ScrollView from '../../src/components/layout/ScrollView.vue'
import LazyVGrid from '../../src/components/layout/LazyVGrid.vue'
import LazyHGrid from '../../src/components/layout/LazyHGrid.vue'
import Overlay from '../../src/components/layout/Overlay.vue'
import Background from '../../src/components/layout/Background.vue'
import SVText from '../../src/components/text/SVText.vue'
import SVLabel from '../../src/components/text/SVLabel.vue'
import SVTextField from '../../src/components/input/SVTextField.vue'
import SecureField from '../../src/components/input/SecureField.vue'
import TextEditor from '../../src/components/input/TextEditor.vue'
import SVButton from '../../src/components/controls/SVButton.vue'
import Toggle from '../../src/components/controls/Toggle.vue'
import SVSlider from '../../src/components/controls/SVSlider.vue'
import Picker from '../../src/components/controls/Picker.vue'
import Stepper from '../../src/components/controls/Stepper.vue'
import DatePicker from '../../src/components/controls/DatePicker.vue'
import Menu from '../../src/components/controls/Menu.vue'
import ContextMenu from '../../src/components/controls/ContextMenu.vue'
import SVList from '../../src/components/data/SVList.vue'
import Form from '../../src/components/data/Form.vue'
import ProgressView from '../../src/components/feedback/ProgressView.vue'
import Gauge from '../../src/components/feedback/Gauge.vue'
import SVImage from '../../src/components/media/SVImage.vue'
import AsyncImage from '../../src/components/media/AsyncImage.vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import TabView from '../../src/components/navigation/TabView.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'

/**
 * `.hidden()` used to be silently dropped: every component wrote its own
 * `display` after spreading the modifier style, so `display: none` was
 * overwritten by `flex`, `grid`, `block` or `inline-flex`. One case per
 * component that takes ModifierProps, so a new component that forgets
 * `composeStyle` fails here.
 */
const cases: Array<[string, Component, Record<string, unknown>?, Record<string, unknown>?]> = [
  ['VStack', VStack],
  ['HStack', HStack],
  ['ZStack', ZStack],
  ['ScrollView', ScrollView],
  ['LazyVGrid', LazyVGrid, { columns: 2 }],
  ['LazyHGrid', LazyHGrid, { rows: 2 }],
  ['Overlay', Overlay, {}, { default: 'x' }],
  ['Background', Background, {}, { default: 'x' }],
  ['Text', SVText, {}, { default: 'body' }],
  ['Text with lineLimit', SVText, { lineLimit: 2 }, { default: 'body' }],
  ['Label', SVLabel, { systemImage: '📁' }, { default: 'Docs' }],
  ['TextField', SVTextField],
  ['SecureField', SecureField],
  ['TextEditor', TextEditor],
  ['Button', SVButton, {}, { default: 'Tap' }],
  ['Toggle', Toggle, { modelValue: false }],
  ['Slider', SVSlider, { modelValue: 5 }],
  ['Picker', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }] }],
  ['Stepper', Stepper, { modelValue: 1 }],
  ['DatePicker', DatePicker, { modelValue: '2026-01-01' }],
  ['Menu', Menu, { label: 'More' }],
  ['ContextMenu', ContextMenu, { label: 'Row' }],
  ['List', SVList],
  ['Form', Form],
  ['ProgressView', ProgressView, { value: 0.5 }],
  ['Gauge (circular)', Gauge, { value: 0.5 }],
  ['Gauge (linear)', Gauge, { value: 0.5, gaugeStyle: 'linear' }],
  ['Image', SVImage, { src: 'a.png', alt: 'A' }],
  ['AsyncImage', AsyncImage, { src: 'a.png', alt: 'A' }],
  ['NavigationStack', NavigationStack],
  ['TabView', TabView, { tabs: [{ id: 'one', label: 'One' }], modelValue: 'one' }],
]

describe('hidden modifier', () => {
  it.each(cases)('%s renders display: none', (_name, component, props, slots) => {
    const wrapper = mount(component, {
      props: { hidden: true, ...props },
      slots: (slots ?? {}) as Record<string, string>,
    })
    expect((wrapper.element as HTMLElement).style.display).toBe('none')
  })

  it('NavigationLink renders display: none', () => {
    const wrapper = mount(NavigationLink, {
      props: { hidden: true, title: 'Next' },
      slots: { destination: () => h(SVText, () => 'pushed') },
    })
    expect((wrapper.element as HTMLElement).style.display).toBe('none')
  })

  // The container alone is not enough: hiding it while the backdrop stays up
  // leaves a dimmed page nothing can dismiss.
  it('Sheet renders nothing at all, backdrop included', async () => {
    const wrapper = mount(Sheet, {
      props: { isPresented: true, hidden: true },
      slots: { default: '<button>Inner</button>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.querySelector('.sheet-overlay')).toBeNull()
    expect(document.body.style.overflow, 'a hidden sheet must not lock the page').not.toBe('hidden')
    wrapper.unmount()
  })

  it('leaves the component its own display when not hidden', () => {
    const wrapper = mount(VStack, { props: { hidden: false } })
    expect((wrapper.element as HTMLElement).style.display).toBe('flex')
  })
})
