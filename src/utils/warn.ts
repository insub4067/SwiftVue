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

/**
 * A form control with no accessible name is a critical accessibility
 * failure and an invisible one: it looks finished, and a screen reader
 * announces it as nothing but its type. Kitchen shipped four of them
 * before an automated audit went looking, which is the argument for
 * saying so out loud at the point of use.
 *
 * `label` is SwiftVue's own prop; `aria-label` and `aria-labelledby` are
 * the escape hatches for a consumer who names the control some other way
 * — including from a real `<label>` that wraps it, which is why an `id`
 * is enough to stay quiet.
 */
export function warnIfUnnamed(component: string, label: string | undefined, attrs: Record<string, unknown>) {
  if (label || attrs['aria-label'] || attrs['aria-labelledby'] || attrs.id) return
  warnDev(
    `<${component}> has no accessible name. Pass \`label\`, or an \`aria-labelledby\` `
    + 'pointing at the text next to it. A screen reader announces an unnamed control as only its type.',
  )
}
