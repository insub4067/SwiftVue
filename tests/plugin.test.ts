import { describe, it, expect } from 'vitest'
import { createApp } from 'vue'
import { SwiftVuePlugin } from '../src/plugin'

const ALL_NAMES = [
  'VStack', 'HStack', 'ZStack', 'Spacer', 'Divider', 'ScrollView', 'LazyVGrid', 'LazyHGrid',
  'Text', 'Label',
  'TextField', 'SecureField', 'TextEditor',
  'Button', 'Toggle', 'Slider', 'Picker', 'Stepper',
  'ForEach', 'List',
  'NavigationStack', 'NavigationLink', 'TabView', 'Sheet',
  'Alert', 'ProgressView',
]

function appWith(options?: { prefix?: string }) {
  const app = createApp({ render: () => null })
  app.use(SwiftVuePlugin, options)
  return app
}

describe('SwiftVuePlugin', () => {
  it('registers every component under its SwiftUI name by default', () => {
    const app = appWith()
    for (const name of ALL_NAMES) {
      expect(app.component(name), name).toBeTruthy()
    }
  })

  it('prefix option renames every registration', () => {
    const app = appWith({ prefix: 'SV' })
    for (const name of ALL_NAMES) {
      expect(app.component(`SV${name}`), `SV${name}`).toBeTruthy()
      expect(app.component(name), `${name} must not leak unprefixed`).toBeUndefined()
    }
  })

  it('prefixed and unprefixed registrations resolve to the same component', () => {
    const plain = appWith()
    const prefixed = appWith({ prefix: 'SV' })
    expect(prefixed.component('SVTextField')).toBe(plain.component('TextField'))
    expect(prefixed.component('SVButton')).toBe(plain.component('Button'))
  })
})
