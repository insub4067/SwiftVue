import { ref, type Ref } from 'vue'

/**
 * SwiftUI @State equivalent.
 * Returns a reactive ref — same as Vue's ref() but named for iOS familiarity.
 *
 * Usage:
 *   const count = useState(0)
 *   const name = useState('')
 */
export function useState<T>(initialValue: T): Ref<T> {
  return ref(initialValue) as Ref<T>
}
