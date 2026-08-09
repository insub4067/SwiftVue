import { inject, type InjectionKey, type Ref, type VNodeChild } from 'vue'

export interface NavigationEntry {
  /** shown in the header while this entry is on top */
  title?: string
  /** the pushed view — usually a closure over a slot or `h()` call */
  content: () => VNodeChild
}

export interface Navigation {
  /** 0 at the root; grows with each push */
  depth: Readonly<Ref<number>>
  push: (entry: NavigationEntry) => void
  pop: () => void
  popToRoot: () => void
}

export const navigationKey: InjectionKey<Navigation> = Symbol('swiftvue-navigation')

/**
 * Programmatic navigation inside the nearest NavigationStack.
 *
 * ```ts
 * const nav = useNavigation()
 * nav?.push({ title: 'Detail', content: () => h(DetailView) })
 * nav?.pop()
 * ```
 *
 * Returns `null` outside a NavigationStack.
 */
export function useNavigation(): Navigation | null {
  return inject(navigationKey, null)
}
