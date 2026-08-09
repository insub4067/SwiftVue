<script setup lang="ts">
import { computed } from 'vue'

export type TransitionPreset =
  | 'opacity'
  | 'scale'
  | 'slide'
  | 'moveTop'
  | 'moveBottom'
  | 'moveLeading'
  | 'moveTrailing'

interface Props {
  /**
   * SwiftUI's `.transition(_:)` for the conditional view inside.
   * `slide` is asymmetric like its namesake: in from leading, out toward
   * trailing. `insertion`/`removal` override either side (`.asymmetric`).
   */
  transition?: TransitionPreset
  insertion?: TransitionPreset
  removal?: TransitionPreset
  /** Vue transition mode, for swapping one view for another */
  mode?: 'out-in' | 'in-out'
}

const props = withDefaults(defineProps<Props>(), { transition: 'opacity' })

const enterFrom = computed(() => `swift-t-${props.insertion ?? props.transition}-in`)
const leaveTo = computed(() => `swift-t-${props.removal ?? props.transition}-out`)
</script>

<template>
  <Transition
    :mode="mode"
    enter-active-class="swift-t-active"
    leave-active-class="swift-t-active"
    :enter-from-class="enterFrom"
    :leave-to-class="leaveTo"
  >
    <slot />
  </Transition>
</template>
