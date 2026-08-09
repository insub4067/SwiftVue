import { createApp } from 'vue'
import { SwiftVuePlugin } from '../src'
import App from './App.vue'

const app = createApp(App)
app.use(SwiftVuePlugin)
app.mount('#app')
