import { computed, type Ref, type WritableComputedRef } from 'vue'

/**
 * SwiftUI @Binding equivalent.
 * Creates a two-way computed ref from a getter/setter pair.
 *
 * Usage:
 *   const parentValue = ref(0)
 *   const binding = useBinding(
 *     () => parentValue.value,
 *     (v) => parentValue.value = v
 *   )
 */
export function useBinding<T>(
  get: () => T,
  set: (value: T) => void,
): WritableComputedRef<T> {
  return computed({ get, set })
}

/**
 * Create a binding from a ref — shorthand for the common case.
 *
 * Usage:
 *   const count = ref(0)
 *   const countBinding = bindRef(count)
 */
export function bindRef<T>(source: Ref<T>): WritableComputedRef<T> {
  return computed({
    get: () => source.value,
    set: (v) => { source.value = v },
  })
}
