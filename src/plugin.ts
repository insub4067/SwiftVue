import type { App } from 'vue'

import VStack from './components/layout/VStack.vue'
import HStack from './components/layout/HStack.vue'
import ZStack from './components/layout/ZStack.vue'
import Spacer from './components/layout/Spacer.vue'
import Divider from './components/layout/Divider.vue'
import ScrollView from './components/layout/ScrollView.vue'

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

import NavigationStack from './components/navigation/NavigationStack.vue'
import NavigationLink from './components/navigation/NavigationLink.vue'
import TabView from './components/navigation/TabView.vue'
import Sheet from './components/navigation/Sheet.vue'

import SAlert from './components/feedback/SAlert.vue'
import ProgressView from './components/feedback/ProgressView.vue'

export const SwiftVuePlugin = {
  install(app: App) {
    // Layout
    app.component('VStack', VStack)
    app.component('HStack', HStack)
    app.component('ZStack', ZStack)
    app.component('Spacer', Spacer)
    app.component('Divider', Divider)
    app.component('ScrollView', ScrollView)

    // Text — registered as "Text" for SwiftUI familiarity
    app.component('Text', SText)
    app.component('Label', SLabel)

    // Input — registered as "TextField"
    app.component('TextField', STextField)
    app.component('SecureField', SecureField)
    app.component('TextEditor', TextEditor)

    // Controls — registered as "Button"
    app.component('Button', SButton)
    app.component('Toggle', Toggle)
    app.component('Slider', SSlider)
    app.component('Picker', Picker)
    app.component('Stepper', Stepper)

    // Data
    app.component('ForEach', ForEach as any)
    app.component('List', SList as any)

    // Navigation
    app.component('NavigationStack', NavigationStack)
    app.component('NavigationLink', NavigationLink)
    app.component('TabView', TabView)
    app.component('Sheet', Sheet)

    // Feedback
    app.component('Alert', SAlert)
    app.component('ProgressView', ProgressView)
  },
}
