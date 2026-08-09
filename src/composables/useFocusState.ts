import { ref, computed, watch, onMounted, type Ref } from 'vue'

/**
 * SwiftUI's `@FocusState`.
 *
 * `null` means nothing is focused. Use a bare ref for a single field, or a
 * union type to track which of several fields holds focus:
 *
 * ```ts
 * const isFocused = useFocusState()              // Ref<boolean | null>
 * const field = useFocusState<'user' | 'pass'>() // Ref<'user' | 'pass' | null>
 * ```
 */
export function useFocusState<T = boolean>(initial: T | null = null): Ref<T | null> {
  return ref(initial) as Ref<T | null>
}

export interface FocusStateProps {
  /** Bound with `v-model:focused`. A boolean, or the tag of the focused field. */
  focused?: unknown
  /** Present for the `equals:` form — this field owns focus when `focused` matches. */
  focusValue?: string | number
}

/**
 * Drives a field element from the `focused`/`focusValue` prop pair and reports
 * focus changes back, so binding stays two-way like SwiftUI's projected value.
 */
export function useFocusBinding(
  props: FocusStateProps,
  emit: (event: 'update:focused', value: unknown) => void,
  el: Ref<HTMLElement | null>,
) {
  const tagged = computed(() => props.focusValue !== undefined)
  const bound = computed(() => tagged.value || props.focused !== undefined)

  const shouldHoldFocus = computed(() =>
    tagged.value ? props.focused === props.focusValue : props.focused === true,
  )

  function syncToDom() {
    const node = el.value
    if (!node) return
    // Guard on activeElement so re-entrant focus/blur events don't loop.
    if (shouldHoldFocus.value) {
      if (document.activeElement !== node) node.focus()
    } else if (document.activeElement === node) {
      node.blur()
    }
  }

  watch(shouldHoldFocus, syncToDom)
  onMounted(() => {
    if (shouldHoldFocus.value) syncToDom()
  })

  return {
    onFocus() {
      if (!bound.value) return
      const next = tagged.value ? props.focusValue : true
      if (props.focused !== next) emit('update:focused', next)
    },
    onBlur() {
      if (!bound.value || !shouldHoldFocus.value) return
      emit('update:focused', tagged.value ? null : false)
    },
    focus: () => el.value?.focus(),
    blur: () => el.value?.blur(),
  }
}
