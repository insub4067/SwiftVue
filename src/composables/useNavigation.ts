import { inject, type InjectionKey, type Ref, type VNodeChild } from 'vue'

export interface NavigationEntry {
  /** shown in the header while this entry is on top */
  title?: string
  /** the pushed view — usually a closure over a slot or `h()` call */
  content: () => VNodeChild
  /** set by the stack when the entry came from a route; not written by callers */
  route?: RouteRef
}

/** A screen named well enough to survive a reload. */
export interface RouteRef {
  id: string
  /** one opaque string the destination can read — an id, a slug, a JSON blob */
  param?: string
}

/** Builds the screen a route names. Receives the param from the URL. */
export type RouteFactory = (param?: string) => NavigationEntry

export interface Navigation {
  /** 0 at the root; grows with each push */
  depth: Readonly<Ref<number>>
  push: (entry: NavigationEntry) => void
  pop: () => void
  popToRoot: () => void
  /**
   * Pushes a screen by name. Unlike `push`, this one has a name the URL can
   * carry, so it comes back after a reload or from a shared link.
   */
  pushRoute: (id: string, param?: string) => void
  /**
   * Teaches the stack to rebuild a screen from its name. Returns the
   * function that takes it back out again.
   */
  registerRoute: (id: string, build: RouteFactory) => () => void
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

/** `id`, or `id~param` — one URL path segment. */
export function serializeRoute(route: RouteRef): string {
  const id = encodeURIComponent(route.id)
  return route.param == null ? id : `${id}~${encodeURIComponent(route.param)}`
}

export function parseRoutes(value: string): RouteRef[] {
  return value.split('/').filter(Boolean).map((segment) => {
    const split = segment.indexOf('~')
    if (split === -1) return { id: decodeURIComponent(segment) }
    return {
      id: decodeURIComponent(segment.slice(0, split)),
      param: decodeURIComponent(segment.slice(split + 1)),
    }
  })
}
