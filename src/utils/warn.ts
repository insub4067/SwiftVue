/**
 * A one-line complaint about misuse a type cannot catch — an ARIA rule
 * broken, a constraint of the platform hit.
 *
 * Silent where `process` is not defined, which is the browser without a
 * bundler: there is no build there to have gone wrong, and a warning nobody
 * asked for would land in a real user's console.
 */
export function warnDev(message: string) {
  if (typeof process === 'undefined') return
  if (process.env?.NODE_ENV === 'production') return
  console.warn(`[SwiftVue] ${message}`)
}
