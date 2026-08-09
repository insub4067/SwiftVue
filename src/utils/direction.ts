/**
 * Whether an element lays out right to left.
 *
 * Gestures cannot be expressed in logical properties the way CSS can: a
 * back swipe travels from the leading edge, and which physical direction
 * that is depends on the writing direction the element resolved to.
 *
 * Falls back to left-to-right where there is no layout to ask — SSR, and
 * test environments that do not compute styles.
 */
export function isRTL(el: Element | null | undefined): boolean {
  if (!el || typeof getComputedStyle !== 'function') return false
  try {
    return getComputedStyle(el).direction === 'rtl'
  } catch {
    return false
  }
}
