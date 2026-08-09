import type { App, Component } from 'vue'

import VStack from './components/layout/VStack.vue'
import HStack from './components/layout/HStack.vue'
import ZStack from './components/layout/ZStack.vue'
import Spacer from './components/layout/Spacer.vue'
import Divider from './components/layout/Divider.vue'
import ScrollView from './components/layout/ScrollView.vue'
import LazyVGrid from './components/layout/LazyVGrid.vue'
import LazyHGrid from './components/layout/LazyHGrid.vue'

import SVText from './components/text/SVText.vue'
import SVLabel from './components/text/SVLabel.vue'

import SVTextField from './components/input/SVTextField.vue'
import SecureField from './components/input/SecureField.vue'
import TextEditor from './components/input/TextEditor.vue'

import SVButton from './components/controls/SVButton.vue'
import Toggle from './components/controls/Toggle.vue'
import SVSlider from './components/controls/SVSlider.vue'
import Picker from './components/controls/Picker.vue'
import Stepper from './components/controls/Stepper.vue'
import DatePicker from './components/controls/DatePicker.vue'
import Menu from './components/controls/Menu.vue'
import ContextMenu from './components/controls/ContextMenu.vue'

import ForEach from './components/data/ForEach.vue'
import SVList from './components/data/SVList.vue'
import Section from './components/data/Section.vue'
import Form from './components/data/Form.vue'
import SwipeActions from './components/data/SwipeActions.vue'

import NavigationStack from './components/navigation/NavigationStack.vue'
import NavigationLink from './components/navigation/NavigationLink.vue'
import TabView from './components/navigation/TabView.vue'
import Sheet from './components/navigation/Sheet.vue'

import SVAlert from './components/feedback/SVAlert.vue'
import ProgressView from './components/feedback/ProgressView.vue'
import Gauge from './components/feedback/Gauge.vue'

import SVImage from './components/media/SVImage.vue'
import AsyncImage from './components/media/AsyncImage.vue'

import TransitionView from './components/motion/TransitionView.vue'

/** Registration name → component. SV-prefixed sources register under their SwiftUI names. */
const components: Record<string, Component> = {
  // Layout
  VStack, HStack, ZStack, Spacer, Divider, ScrollView, LazyVGrid, LazyHGrid,
  // Text
  Text: SVText,
  Label: SVLabel,
  // Input
  TextField: SVTextField,
  SecureField, TextEditor,
  // Controls
  Button: SVButton,
  Toggle,
  Slider: SVSlider,
  Picker, Stepper, DatePicker, Menu, ContextMenu,
  // Data — generic components don't satisfy Component structurally
  ForEach: ForEach as unknown as Component,
  List: SVList as unknown as Component,
  Section,
  Form,
  SwipeActions,
  // Navigation
  NavigationStack, NavigationLink, TabView, Sheet,
  // Feedback
  Alert: SVAlert,
  ProgressView,
  Gauge,
  // Media
  Image: SVImage,
  AsyncImage,
  // Motion
  TransitionView,
}

export interface SwiftVuePluginOptions {
  /**
   * Prepended to every registered name — `{ prefix: 'SV' }` turns
   * `<TextField>` into `<SVTextField>`. Reach for this when the SwiftUI
   * names collide with another library, or with in-DOM templates where
   * case-insensitive parsing folds `<Text>` into SVG's `<text>`.
   * Named imports from 'swiftvue' are unaffected.
   */
  prefix?: string
}

export const SwiftVuePlugin = {
  install(app: App, options: SwiftVuePluginOptions = {}) {
    const prefix = options.prefix ?? ''
    for (const [name, component] of Object.entries(components)) {
      app.component(prefix + name, component)
    }
  },
}
