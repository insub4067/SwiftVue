// SwiftVue — SwiftUI-style components for Vue.js

// Styles
import './styles/swift.css'

// Plugin (global registration)
export { SwiftVuePlugin } from './plugin'
export type { SwiftVuePluginOptions } from './plugin'

// Layout
export { default as VStack } from './components/layout/VStack.vue'
export { default as HStack } from './components/layout/HStack.vue'
export { default as ZStack } from './components/layout/ZStack.vue'
export { default as Spacer } from './components/layout/Spacer.vue'
export { default as Divider } from './components/layout/Divider.vue'
export { default as ScrollView } from './components/layout/ScrollView.vue'
export { default as LazyVGrid } from './components/layout/LazyVGrid.vue'
export { default as LazyHGrid } from './components/layout/LazyHGrid.vue'
export { default as Overlay } from './components/layout/Overlay.vue'
export { default as Background } from './components/layout/Background.vue'
export type { OverlayAlignment, OverlayProps } from './components/layout/Overlay.vue'
export type { BackgroundProps } from './components/layout/Background.vue'

// Text
export { default as Text } from './components/text/SVText.vue'
export { default as Label } from './components/text/SVLabel.vue'

// Input
export { default as TextField } from './components/input/SVTextField.vue'
export { default as SecureField } from './components/input/SecureField.vue'
export { default as TextEditor } from './components/input/TextEditor.vue'

// Controls
export { default as Button } from './components/controls/SVButton.vue'
export { default as Toggle } from './components/controls/Toggle.vue'
export { default as Slider } from './components/controls/SVSlider.vue'
export { default as Picker } from './components/controls/Picker.vue'
export { default as Stepper } from './components/controls/Stepper.vue'
export { default as DatePicker } from './components/controls/DatePicker.vue'
export { default as Menu } from './components/controls/Menu.vue'
export { default as ContextMenu } from './components/controls/ContextMenu.vue'

// Data
export { default as ForEach } from './components/data/ForEach.vue'
export { default as List } from './components/data/SVList.vue'
export { default as Section } from './components/data/Section.vue'
export { default as Form } from './components/data/Form.vue'
export { default as SwipeActions } from './components/data/SwipeActions.vue'

// Navigation
export { default as NavigationStack } from './components/navigation/NavigationStack.vue'
export { default as NavigationLink } from './components/navigation/NavigationLink.vue'
export { default as NavigationSplitView } from './components/navigation/NavigationSplitView.vue'
export { default as TabView } from './components/navigation/TabView.vue'
export { default as Sheet } from './components/navigation/Sheet.vue'
export { default as FullScreenCover } from './components/navigation/FullScreenCover.vue'

// Feedback
export { default as Alert } from './components/feedback/SVAlert.vue'
export { default as ProgressView } from './components/feedback/ProgressView.vue'
export { default as Gauge } from './components/feedback/Gauge.vue'

// Component prop/option types users write themselves
export type { AlertAction, AlertProps } from './components/feedback/SVAlert.vue'
export type { PickerOption, PickerProps } from './components/controls/Picker.vue'
export type { TabItem, TabViewProps } from './components/navigation/TabView.vue'
export type { SectionProps } from './components/data/Section.vue'
export type { FormProps } from './components/data/Form.vue'
export type { SwipeAction, SwipeActionsProps } from './components/data/SwipeActions.vue'
export type { DatePickerProps } from './components/controls/DatePicker.vue'
export type { MenuAction, MenuProps } from './components/controls/Menu.vue'
export type { ContextMenuProps } from './components/controls/ContextMenu.vue'
export type { GaugeProps } from './components/feedback/Gauge.vue'
export type { NavigationStackProps } from './components/navigation/NavigationStack.vue'
export type { NavigationSplitViewProps, SplitViewVisibility } from './components/navigation/NavigationSplitView.vue'
export type { FullScreenCoverProps } from './components/navigation/FullScreenCover.vue'
export type { ListProps } from './components/data/SVList.vue'
export type { TransitionPreset } from './components/motion/TransitionView.vue'

// Media
export { default as Image } from './components/media/SVImage.vue'
export { default as AsyncImage } from './components/media/AsyncImage.vue'
export type { ImageProps } from './components/media/SVImage.vue'
export type { AsyncImageProps, AsyncImagePhase } from './components/media/AsyncImage.vue'

// Motion
export { default as TransitionView } from './components/motion/TransitionView.vue'
export { withAnimation, Animations } from './motion/withAnimation'
export type { SwiftAnimation, WithAnimationOptions } from './motion/withAnimation'
export { vAnimate } from './motion/vAnimate'

// Composables
export { useState } from './composables/useState'
export { useBinding, bindRef } from './composables/useBinding'
export {
  useEnvironment,
  provideEnvironment,
  createEnvironmentKey,
} from './composables/useEnvironment'
export { useAppStorage, removeAppStorage } from './composables/useAppStorage'
export { useNavigation, navigationKey } from './composables/useNavigation'
export { onAppear, onDisappear } from './composables/useLifecycle'
export { onSubmit } from './composables/useSubmit'
export { useSwipe } from './composables/useSwipe'
export type { SwipeDirection, SwipeSample, SwipeOptions } from './composables/useSwipe'
export type { Navigation, NavigationEntry, RouteRef, RouteFactory } from './composables/useNavigation'
export { useFocusState, useFocusBinding } from './composables/useFocusState'
export type { FocusStateProps } from './composables/useFocusState'
export { usePreferredColorScheme } from './composables/usePreferredColorScheme'
export type { ColorScheme } from './composables/usePreferredColorScheme'
export { onChange } from './composables/onChange'
export type { OnChangeOptions } from './composables/onChange'
export { publisher } from './combine/publisher'
export type { Publisher } from './combine/publisher'

// Utilities
export { resolveColor, resolveFont, SwiftColors, SwiftFonts } from './utils/theme'
export type { SwiftColorName, SwiftFontStyle } from './utils/theme'
export { buildModifierStyle, useModifiers, composeStyle } from './utils/modifiers'
export type { ModifierProps, FrameModifier, ShadowModifier } from './utils/modifiers'
export { resolveTracks } from './utils/grid'
export type { GridItem } from './utils/grid'
