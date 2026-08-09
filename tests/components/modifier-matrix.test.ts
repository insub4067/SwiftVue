import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, type Component } from 'vue'

import HStack from '../../src/components/layout/HStack.vue'
import VStack from '../../src/components/layout/VStack.vue'
import ZStack from '../../src/components/layout/ZStack.vue'
import ScrollView from '../../src/components/layout/ScrollView.vue'
import LazyVGrid from '../../src/components/layout/LazyVGrid.vue'
import LazyHGrid from '../../src/components/layout/LazyHGrid.vue'
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
import SwipeActions from '../../src/components/data/SwipeActions.vue'
import ProgressView from '../../src/components/feedback/ProgressView.vue'
import Gauge from '../../src/components/feedback/Gauge.vue'
import SVImage from '../../src/components/media/SVImage.vue'
import AsyncImage from '../../src/components/media/AsyncImage.vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import TabView from '../../src/components/navigation/TabView.vue'

/**
 * The library's central promise is that a SwiftUI modifier applies. `hidden`
 * turned out never to have worked on any component, and fixing that one
 * exposed the shape of the problem: a component writes its own style after
 * the modifier's, so whatever it happens to set is silently the winner.
 *
 * This is that promise as a matrix. Every modifier, on every component that
 * accepts ModifierProps. A component that quietly drops one fails here.
 */

type Case = [name: string, component: Component, props?: Record<string, unknown>, slots?: Record<string, string>]

const CASES: Case[] = [
  ['VStack', VStack],
  ['HStack', HStack],
  ['ZStack', ZStack],
  ['ScrollView', ScrollView],
  ['LazyVGrid', LazyVGrid, { columns: 2 }],
  ['LazyHGrid', LazyHGrid, { rows: 2 }],
  ['Text', SVText, {}, { default: 'body' }],
  ['Label', SVLabel, { systemImage: '📁' }, { default: 'Docs' }],
  ['TextField', SVTextField],
  ['SecureField', SecureField],
  ['TextEditor', TextEditor],
  ['Button', SVButton, {}, { default: 'Tap' }],
  ['Toggle', Toggle, { modelValue: false }],
  ['Slider', SVSlider, { modelValue: 5 }],
  ['Picker', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }] }],
  ['Picker (segmented)', Picker, { modelValue: 'a', options: [{ label: 'A', value: 'a' }], pickerStyle: 'segmented' }],
  ['Stepper', Stepper, { modelValue: 1 }],
  ['DatePicker', DatePicker, { modelValue: '2026-01-01' }],
  ['Menu', Menu, { label: 'More' }],
  ['ContextMenu', ContextMenu, { label: 'Row' }],
  ['List', SVList],
  ['Form', Form],
  ['SwipeActions', SwipeActions, { trailing: [{ label: 'Delete' }] }],
  ['ProgressView', ProgressView, { value: 0.5 }],
  ['Gauge', Gauge, { value: 0.5, label: 'Meter' }],
  ['Gauge (linear)', Gauge, { value: 0.5, label: 'Meter', gaugeStyle: 'linear' }],
  ['Image', SVImage, { src: 'a.png', alt: 'A' }],
  ['AsyncImage', AsyncImage, { url: 'a.png', alt: 'A' }],
  ['NavigationStack', NavigationStack],
  ['TabView', TabView, { tabs: [{ id: 'one', label: 'One' }], modelValue: 'one' }],
]

/** Each modifier, and the CSS it must put on the root element. */
const MODIFIERS: Array<[name: string, props: Record<string, unknown>, expected: Record<string, string>]> = [
  ['foregroundColor', { foregroundColor: 'red' }, { color: 'var(--swift-red)' }],
  ['background', { background: 'green' }, { backgroundColor: 'var(--swift-green)' }],
  ['cornerRadius', { cornerRadius: 20 }, { borderRadius: '20px' }],
  ['font', { font: 'largeTitle' }, { fontSize: '34px', lineHeight: '41px' }],
  ['fontWeight', { fontWeight: 'heavy' }, { fontWeight: '800' }],
  ['padding', { padding: 24 }, { padding: '24px' }],
  ['frame width', { frame: { width: 123 } }, { width: '123px' }],
  ['frame height', { frame: { height: 77 } }, { height: '77px' }],
  ['frame maxWidth', { frame: { maxWidth: 456 } }, { maxWidth: '456px' }],
  ['opacity', { opacity: 0.3 }, { opacity: '0.3' }],
  ['shadow', { shadow: { radius: 4 } }, { boxShadow: '0px 2px 8px rgba(0,0,0,0.15)' }],
  ['zIndex', { zIndex: 7 }, { zIndex: '7' }],
]

function styleOf(component: Component, props: Record<string, unknown>, slots?: Record<string, string>) {
  const wrapper = mount(component, { props, slots: slots ?? {} })
  return (wrapper.element as HTMLElement).style
}

describe('every modifier applies to every component', () => {
  for (const [modifierName, modifierProps, expected] of MODIFIERS) {
    describe(modifierName, () => {
      it.each(CASES)('%s', (_name, component, props, slots) => {
        const style = styleOf(component, { ...modifierProps, ...props }, slots)
        for (const [property, value] of Object.entries(expected)) {
          expect(style[property as never], property).toBe(value)
        }
      })
    })
  }
})

// The other half of the contract: a modifier wins, but it cannot dismantle
// the component. A VStack that is not a column is not a VStack.
describe('a modifier cannot break what the component is', () => {
  it.each([
    ['VStack stays a column', VStack, {}, 'flexDirection', 'column'],
    ['HStack stays a row', HStack, {}, 'flexDirection', 'row'],
    ['ZStack stays a grid', ZStack, {}, 'display', 'grid'],
    ['Menu stays positioned', Menu, { label: 'More' }, 'position', 'relative'],
    ['ContextMenu stays positioned', ContextMenu, { label: 'Row' }, 'position', 'relative'],
    ['SwipeActions clips its slabs', SwipeActions, { trailing: [{ label: 'x' }] }, 'overflow', 'hidden'],
  ])('%s', (_name, component, props, property, value) => {
    // every modifier at once, to be sure none of them wins this argument
    const all = MODIFIERS.reduce((acc, [, p]) => ({ ...acc, ...p }), {})
    const style = styleOf(component, { ...all, ...props })
    expect(style[property as never]).toBe(value)
  })

  it('a scroller keeps scrolling whatever the modifiers say', () => {
    const style = styleOf(ScrollView, { axes: 'horizontal', overflowX: 'visible' })
    expect(style.overflowX).toBe('auto')
  })

  it('hidden still outranks everything, essentials included', () => {
    const all = MODIFIERS.reduce((acc, [, p]) => ({ ...acc, ...p }), {})
    expect(styleOf(VStack, { ...all, hidden: true }).display).toBe('none')
    expect(styleOf(ZStack, { ...all, hidden: true }).display).toBe('none')
  })
})

// A component's own dedicated prop is more specific than a general modifier,
// so it keeps the last word where the two describe the same thing.
describe('a dedicated prop beats the general modifier', () => {
  it('Text bold beats fontWeight', () => {
    expect(styleOf(SVText, { bold: true, fontWeight: 'light' }, { default: 'x' }).fontWeight).toBe('700')
  })

  it('VStack alignment beats frame alignment', () => {
    const style = styleOf(VStack, { alignment: 'leading', frame: { alignment: 'trailing' } })
    expect(style.alignItems).toBe('flex-start')
  })

  it('Toggle dims itself when disabled', () => {
    expect(styleOf(Toggle, { modelValue: false, disabled: true, opacity: 1 }).opacity).toBe('0.5')
  })

  it('but an enabled Toggle takes the opacity it was given', () => {
    expect(styleOf(Toggle, { modelValue: false, opacity: 0.3 }).opacity).toBe('0.3')
  })
})

describe('NavigationLink', () => {
  it.each(MODIFIERS)('%s applies', (_name, modifierProps, expected) => {
    const wrapper = mount(NavigationLink, {
      props: { ...modifierProps, destinationTitle: 'Next' },
      slots: { default: 'Row', destination: () => h(SVText, () => 'pushed') },
    })
    const style = (wrapper.element as HTMLElement).style
    for (const [property, value] of Object.entries(expected)) {
      expect(style[property as never], property).toBe(value)
    }
  })
})
