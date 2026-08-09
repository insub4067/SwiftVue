<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface ImageProps extends ModifierProps {
  src?: string
  /** Describe the image, or leave empty for decorative ones. */
  alt?: string
  /** SwiftUI's .resizable(): without it the image keeps its intrinsic size. */
  resizable?: boolean
  /** .aspectRatio(contentMode:) — fit letterboxes, fill crops. */
  contentMode?: 'fit' | 'fill'
  loading?: 'lazy' | 'eager'
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers } from '../../utils/modifiers'

const props = withDefaults(defineProps<ImageProps>(), {
  contentMode: 'fit',
  loading: 'lazy',
})

const modifierStyle = useModifiers(props)

const style = computed(() => {
  const base = { ...modifierStyle.value }
  if (!props.resizable) return { ...base, display: 'block' as const }
  return {
    ...base,
    display: 'block' as const,
    width: base.width ?? '100%',
    height: base.height ?? '100%',
    // fit letterboxes inside the frame, fill crops to cover it
    objectFit: (props.contentMode === 'fill' ? 'cover' : 'contain') as 'cover' | 'contain',
  }
})
</script>

<template>
  <img
    :src="src"
    :alt="alt ?? ''"
    :loading="loading"
    :aria-hidden="alt ? undefined : 'true'"
    :style="style"
  >
</template>
