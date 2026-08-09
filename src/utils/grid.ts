export interface GridItem {
  /** A track of exactly this size. */
  fixed?: number | string
  /** A track that grows to fill space, optionally clamped. */
  flexible?: { minimum?: number | string; maximum?: number | string }
  /**
   * As many tracks of at least `minimum` as fit. A bare number is the minimum.
   * CSS allows only one auto-repeat per axis, so keep this the only adaptive item.
   */
  adaptive?: number | string | { minimum: number | string; maximum?: number | string }
}

function len(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value
}

function track(item: GridItem): string {
  if (item.adaptive != null) {
    const a = typeof item.adaptive === 'object' ? item.adaptive : { minimum: item.adaptive }
    return `repeat(auto-fill, minmax(${len(a.minimum)}, ${'maximum' in a && a.maximum != null ? len(a.maximum) : '1fr'}))`
  }
  if (item.fixed != null) return len(item.fixed)

  const f = item.flexible ?? {}
  // A bare `1fr` floors at min-content, which lets wide children push the track
  // — and the whole grid — past its container. minmax(0, …) lets tracks shrink.
  return `minmax(${f.minimum != null ? len(f.minimum) : '0'}, ${f.maximum != null ? len(f.maximum) : '1fr'})`
}

/**
 * Builds a `grid-template-columns`/`grid-template-rows` value.
 * A number means that many equal tracks; an array describes each track.
 */
export function resolveTracks(spec: number | GridItem[]): string {
  if (typeof spec === 'number') {
    // repeat(0, …) is invalid CSS and would drop the whole declaration.
    return `repeat(${Math.max(1, Math.floor(spec))}, minmax(0, 1fr))`
  }
  if (!spec.length) return 'minmax(0, 1fr)'
  return spec.map(track).join(' ')
}
