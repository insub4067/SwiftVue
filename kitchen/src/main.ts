import { createApp } from 'vue'
import { SwiftVuePlugin } from '@swiftvue'
import '@swiftvue/styles'
import App from './App.vue'

createApp(App).use(SwiftVuePlugin).mount('#app')
