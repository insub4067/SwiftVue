import { createApp } from 'vue'
import { SwiftVuePlugin } from '../src'
import '../src/styles/swift.css'
import App from './App.vue'

const app = createApp(App)
app.use(SwiftVuePlugin)
app.mount('#app')
