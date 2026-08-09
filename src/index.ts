// SwiftVue — SwiftUI-style components for Vue.js

// Styles
import './styles/swift.css'

// Plugin (global registration)
export { SwiftVuePlugin } from './plugin'

// Layout
export { default as VStack } from './components/layout/VStack.vue'
export { default as HStack } from './components/layout/HStack.vue'
export { default as ZStack } from './components/layout/ZStack.vue'
export { default as Spacer } from './components/layout/Spacer.vue'
export { default as Divider } from './components/layout/Divider.vue'
export { default as ScrollView } from './components/layout/ScrollView.vue'
export { default as LazyVGrid } from './components/layout/LazyVGrid.vue'
export { default as LazyHGrid } from './components/layout/LazyHGrid.vue'

// Text
export { default as Text } from './components/text/SText.vue'
export { default as Label } from './components/text/SLabel.vue'

// Input
export { default as TextField } from './components/input/STextField.vue'
export { default as SecureField } from './components/input/SecureField.vue'
export { default as TextEditor } from './components/input/TextEditor.vue'

// Controls
export { default as Button } from './components/controls/SButton.vue'
export { default as Toggle } from './components/controls/Toggle.vue'
export { default as Slider } from './components/controls/SSlider.vue'
export { default as Picker } from './components/controls/Picker.vue'
export { default as Stepper } from './components/controls/Stepper.vue'

// Data
export { default as ForEach } from './components/data/ForEach.vue'
export { default as List } from './components/data/SList.vue'

// Navigation
export { default as NavigationStack } from './components/navigation/NavigationStack.vue'
export { default as NavigationLink } from './components/navigation/NavigationLink.vue'
export { default as TabView } from './components/navigation/TabView.vue'
export { default as Sheet } from './components/navigation/Sheet.vue'

// Feedback
export { default as Alert } from './components/feedback/SAlert.vue'
export { default as ProgressView } from './components/feedback/ProgressView.vue'

// Composables
export { useState } from './composables/useState'
export { useBinding, bindRef } from './composables/useBinding'
export {
  useEnvironment,
  provideEnvironment,
  createEnvironmentKey,
} from './composables/useEnvironment'
export { useAppStorage } from './composables/useAppStorage'

// Utilities
export { resolveColor, resolveFont, SwiftColors, SwiftFonts } from './utils/theme'
export type { SwiftColorName, SwiftFontStyle } from './utils/theme'
export { buildModifierStyle, useModifiers } from './utils/modifiers'
export type { ModifierProps, FrameModifier, ShadowModifier } from './utils/modifiers'
export { resolveTracks } from './utils/grid'
export type { GridItem } from './utils/grid'
