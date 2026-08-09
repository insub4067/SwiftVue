import { inject, provide, type InjectionKey } from 'vue'

/**
 * SwiftUI @Environment / @EnvironmentObject equivalent.
 * Uses Vue's provide/inject under the hood.
 *
 * Usage (parent):
 *   const ThemeKey = createEnvironmentKey<Theme>('theme')
 *   provideEnvironment(ThemeKey, { mode: 'dark' })
 *
 * Usage (child):
 *   const theme = useEnvironment(ThemeKey)
 */

export function createEnvironmentKey<T>(name: string): InjectionKey<T> {
  return Symbol(name) as InjectionKey<T>
}

export function provideEnvironment<T>(key: InjectionKey<T>, value: T): void {
  provide(key, value)
}

export function useEnvironment<T>(key: InjectionKey<T>): T
export function useEnvironment<T>(key: InjectionKey<T>, defaultValue: T): T
export function useEnvironment<T>(key: InjectionKey<T>, defaultValue?: T): T {
  const value = inject(key, defaultValue)
  if (value === undefined) {
    throw new Error(`[SwiftVue] Environment value not found. Did you call provideEnvironment()?`)
  }
  return value
}
