import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import {
  createEnvironmentKey,
  provideEnvironment,
  useEnvironment,
} from '../../src/composables/useEnvironment'

describe('useEnvironment', () => {
  it('provides and injects values', () => {
    const ThemeKey = createEnvironmentKey<string>('theme')
    let injected = ''

    const Child = defineComponent({
      setup() {
        injected = useEnvironment(ThemeKey)
        return () => h('div')
      },
    })

    const Parent = defineComponent({
      setup() {
        provideEnvironment(ThemeKey, 'dark')
        return () => h(Child)
      },
    })

    mount(Parent)
    expect(injected).toBe('dark')
  })

  it('throws when value is not provided', () => {
    const MissingKey = createEnvironmentKey<number>('missing')

    const Child = defineComponent({
      setup() {
        useEnvironment(MissingKey)
        return () => h('div')
      },
    })

    expect(() => mount(Child)).toThrow('[SwiftVue] Environment value not found')
  })

  it('returns default value when provided', () => {
    const OptionalKey = createEnvironmentKey<string>('optional')
    let injected = ''

    const Child = defineComponent({
      setup() {
        injected = useEnvironment(OptionalKey, 'fallback')
        return () => h('div')
      },
    })

    mount(Child)
    expect(injected).toBe('fallback')
  })
})
