import { watch, type WatchSource, type WatchStopHandle } from 'vue'

/**
 * The slice of Combine that UI code actually uses, over Vue reactivity.
 * This is deliberately not a full FRP runtime: a publisher wraps a reactive
 * source, operators describe the pipeline, and nothing runs until `sink`.
 *
 * ```ts
 * const stop = publisher(searchText)
 *   .debounce(300)
 *   .removeDuplicates()
 *   .sink(query => search(query))
 * ```
 *
 * Called during setup, the subscription stops with the component;
 * the returned handle stops it earlier.
 */
export interface Publisher<T> {
  map<U>(transform: (value: T) => U): Publisher<U>
  filter(predicate: (value: T) => boolean): Publisher<T>
  /** drop values equal to the previous delivered value */
  removeDuplicates(equals?: (a: T, b: T) => boolean): Publisher<T>
  /** deliver only after the source has been quiet this long (ms) */
  debounce(milliseconds: number): Publisher<T>
  /** deliver at most once per interval, leading edge (ms) */
  throttle(milliseconds: number): Publisher<T>
  /** start receiving values; this is what subscribes */
  sink(receive: (value: T) => void): WatchStopHandle
}

interface OpContext {
  onStop(cleanup: () => void): void
}

type Receive = (value: unknown) => void
type Operator = (ctx: OpContext) => (next: Receive) => Receive

function make(source: WatchSource<any>, ops: Operator[]): Publisher<any> {
  const extend = (op: Operator) => make(source, [...ops, op])

  return {
    map: (transform) => extend(() => next => value => next(transform(value))),

    filter: (predicate) => extend(() => next => value => {
      if (predicate(value)) next(value)
    }),

    removeDuplicates: (equals = (a, b) => a === b) => extend(() => {
      let delivered = false
      let last: unknown
      return next => value => {
        if (delivered && equals(last, value)) return
        delivered = true
        last = value
        next(value)
      }
    }),

    debounce: (milliseconds) => extend((ctx) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      ctx.onStop(() => clearTimeout(timer))
      return next => value => {
        clearTimeout(timer)
        timer = setTimeout(() => next(value), milliseconds)
      }
    }),

    throttle: (milliseconds) => extend(() => {
      let lastDelivery = -Infinity
      return next => value => {
        const now = Date.now()
        if (now - lastDelivery >= milliseconds) {
          lastDelivery = now
          next(value)
        }
      }
    }),

    sink(receive) {
      const cleanups: Array<() => void> = []
      const ctx: OpContext = { onStop: (cleanup) => cleanups.push(cleanup) }

      // assemble receiver-side first so values flow source → ops → sink
      let deliver: Receive = receive as Receive
      for (let i = ops.length - 1; i >= 0; i--) {
        deliver = ops[i](ctx)(deliver)
      }

      const stop = watch(source, (value) => deliver(value))
      return (() => {
        stop()
        for (const cleanup of cleanups) cleanup()
      }) as WatchStopHandle
    },
  }
}

/** Wrap a ref, computed, or getter as a Publisher. */
export function publisher<T>(source: WatchSource<T>): Publisher<T> {
  return make(source, [])
}
