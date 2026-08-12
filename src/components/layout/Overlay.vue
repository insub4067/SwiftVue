<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export type OverlayAlignment =
  | 'center' | 'top' | 'bottom' | 'leading' | 'trailing'
  | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'

export interface OverlayProps extends ModifierProps {
  /** where the overlay sits within the content's bounds — SwiftUI's `alignment:` */
  alignment?: OverlayAlignment
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<OverlayProps>(), { alignment: 'center' })

// `flex-start`/`flex-end` on the main axis follow the writing direction, so
// `leading`/`trailing` mirror in a right-to-left layout with no work by hand —
// the same reason the modifier system's own alignment map uses them.
const alignMap: Record<OverlayAlignment, { justifyContent: string; alignItems: string }> = {
  center: { justifyContent: 'center', alignItems: 'center' },
  top: { justifyContent: 'center', alignItems: 'flex-start' },
  bottom: { justifyContent: 'center', alignItems: 'flex-end' },
  leading: { justifyContent: 'flex-start', alignItems: 'center' },
  trailing: { justifyContent: 'flex-end', alignItems: 'center' },
  topLeading: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  topTrailing: { justifyContent: 'flex-end', alignItems: 'flex-start' },
  bottomLeading: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  bottomTrailing: { justifyContent: 'flex-end', alignItems: 'flex-end' },
}

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(
  modifierStyle.value,
  // Hugs the content, the way SwiftUI's overlay leaves the base view's size
  // alone — overridable with `frame` when a consumer wants otherwise.
  { display: 'inline-block' },
  // The positioning context the overlay is placed against. Essential: without
  // it the absolute layer would escape to the nearest positioned ancestor.
  { position: 'relative' as const },
))

// The layer fills the content's box and never contributes to its size (it is
// out of flow), so the content alone decides how big the whole thing is —
// exactly SwiftUI's rule that the overlay does not change the layout.
const layerStyle = computed(() => ({
  position: 'absolute' as const,
  inset: '0',
  display: 'flex',
  // Clicks fall through the empty parts of the layer to the content beneath;
  // the overlay's own content takes them back (see the scoped rule below).
  pointerEvents: 'none' as const,
  ...alignMap[props.alignment],
}))
</script>

<template>
  <div :style="style">
    <slot />
    <div class="swift-overlay-layer" :style="layerStyle">
      <div class="swift-overlay-content" style="pointer-events: auto"><slot name="overlay" /></div>
    </div>
  </div>
</template>
