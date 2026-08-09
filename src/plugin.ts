import type { App, Component } from 'vue'

import VStack from './components/layout/VStack.vue'
import HStack from './components/layout/HStack.vue'
import ZStack from './components/layout/ZStack.vue'
import Spacer from './components/layout/Spacer.vue'
import Divider from './components/layout/Divider.vue'
import ScrollView from './components/layout/ScrollView.vue'
import LazyVGrid from './components/layout/LazyVGrid.vue'
import LazyHGrid from './components/layout/LazyHGrid.vue'

import SText from './components/text/SText.vue'
import SLabel from './components/text/SLabel.vue'

import STextField from './components/input/STextField.vue'
import SecureField from './components/input/SecureField.vue'
import TextEditor from './components/input/TextEditor.vue'

import SButton from './components/controls/SButton.vue'
import Toggle from './components/controls/Toggle.vue'
import SSlider from './components/controls/SSlider.vue'
import Picker from './components/controls/Picker.vue'
import Stepper from './components/controls/Stepper.vue'

import ForEach from './components/data/ForEach.vue'
import SList from './components/data/SList.vue'
import Section from './components/data/Section.vue'

import NavigationStack from './components/navigation/NavigationStack.vue'
import NavigationLink from './components/navigation/NavigationLink.vue'
import TabView from './components/navigation/TabView.vue'
import Sheet from './components/navigation/Sheet.vue'

import SAlert from './components/feedback/SAlert.vue'
import ProgressView from './components/feedback/ProgressView.vue'

import TransitionView from './components/motion/TransitionView.vue'

/** Registration name → component. S-prefixed sources register under SwiftUI names. */
const components: Record<string, Component> = {
  // Layout
  VStack, HStack, ZStack, Spacer, Divider, ScrollView, LazyVGrid, LazyHGrid,
  // Text
  Text: SText,
  Label: SLabel,
  // Input
  TextField: STextField,
  SecureField, TextEditor,
  // Controls
  Button: SButton,
  Toggle,
  Slider: SSlider,
  Picker, Stepper,
  // Data — generic components don't satisfy Component structurally
  ForEach: ForEach as unknown as Component,
  List: SList as unknown as Component,
  Section,
  // Navigation
  NavigationStack, NavigationLink, TabView, Sheet,
  // Feedback
  Alert: SAlert,
  ProgressView,
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
