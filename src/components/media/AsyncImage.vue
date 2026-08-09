<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

/** SwiftUI's AsyncImagePhase. */
export type AsyncImagePhase = 'empty' | 'success' | 'failure'

export interface AsyncImageProps extends ModifierProps {
  url?: string
  alt?: string
  resizable?: boolean
  contentMode?: 'fit' | 'fill'
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<AsyncImageProps>(), {
  contentMode: 'fit',
  resizable: true,
})

defineSlots<{
  /** while the image is loading — SwiftUI's .empty phase */
  placeholder?: () => unknown
  /** when loading failed — .failure */
  error?: () => unknown
}>()

// The <img> element drives the phase, so nothing here touches the DOM at
// setup and the component renders on the server.
const phase = ref<AsyncImagePhase>('empty')
watch(() => props.url, () => { phase.value = 'empty' })

const modifierStyle = useModifiers(props)
const frameStyle = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}))

const imageStyle = computed(() => (props.resizable
  ? {
      display: 'block' as const,
      width: '100%',
      height: '100%',
      objectFit: (props.contentMode === 'fill' ? 'cover' : 'contain') as 'cover' | 'contain',
    }
  : { display: 'block' as const }))
</script>

<template>
  <div :style="frameStyle">
    <!-- kept in the tree while loading so the events can fire; hidden until ready -->
    <img
      v-show="phase === 'success'"
      :src="url"
      :alt="alt ?? ''"
      :aria-hidden="alt ? undefined : 'true'"
      :style="imageStyle"
      @load="phase = 'success'"
      @error="phase = 'failure'"
    >

    <slot v-if="phase === 'empty'" name="placeholder">
      <span class="async-image-spinner" aria-hidden="true" />
    </slot>

    <slot v-else-if="phase === 'failure'" name="error">
      <!-- a decorative image stays decorative when it fails; only a
           described one is worth announcing as broken -->
      <span
        v-if="alt"
        class="async-image-failed"
        role="img"
        :aria-label="`${alt} (failed to load)`"
      >⚠</span>
      <span v-else class="async-image-failed" aria-hidden="true">⚠</span>
    </slot>
  </div>
</template>

<style scoped>
.async-image-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid var(--swift-fill);
  border-top-color: var(--swift-secondary);
  animation: async-image-spin 0.8s linear infinite;
}
@keyframes async-image-spin { to { transform: rotate(360deg); } }

.async-image-failed {
  font-size: 22px;
  color: var(--swift-tertiary-label);
}

@media (prefers-reduced-motion: reduce) {
  .async-image-spinner { animation-duration: 2s; }
}
</style>
