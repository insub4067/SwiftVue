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

// `~` divides an id from its param and `/` divides segments, so both have to
// survive encoding. encodeURIComponent leaves `~` alone — it is an unreserved
// character — so that one is escaped by hand.
function encodePart(value: string): string {
  return encodeURIComponent(value).replace(/~/g, '%7E')
}

// The value comes from the address bar, where anything can be typed or
// truncated. `decodeURIComponent('%')` throws, and a throw here would take
// down the mount that is reading the link.
function decodePart(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

/** `id`, or `id~param` — one URL path segment. */
export function serializeRoute(route: RouteRef): string {
  const id = encodePart(route.id)
  return route.param == null ? id : `${id}~${encodePart(route.param)}`
}

/**
 * Reads back what `serializeRoute` wrote. A segment that will not decode ends
 * the list rather than throwing: the screens named before it are still real,
 * and the app stops where the link stopped making sense.
 */
export function parseRoutes(value: string): RouteRef[] {
  const routes: RouteRef[] = []
  for (const segment of value.split('/')) {
    if (!segment) continue
    const split = segment.indexOf('~')
    const id = decodePart(split === -1 ? segment : segment.slice(0, split))
    if (id == null) break
    if (split === -1) {
      routes.push({ id })
      continue
    }
    const param = decodePart(segment.slice(split + 1))
    if (param == null) break
    routes.push({ id, param })
  }
  return routes
}
