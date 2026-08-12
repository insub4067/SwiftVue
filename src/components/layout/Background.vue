<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'
import type { OverlayAlignment } from './Overlay.vue'

export interface BackgroundProps extends ModifierProps {
  /** where the background view sits within the content's bounds */
  alignment?: OverlayAlignment
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<BackgroundProps>(), { alignment: 'center' })

// Same mapping as Overlay — the only difference between the two is which layer
// is painted on top; the geometry is identical.
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
  { display: 'inline-block' },
  // `isolation: isolate` opens a stacking context so the background and the
  // content are ordered against each other alone, never against the page.
  { position: 'relative' as const, isolation: 'isolate' as const },
))

// The background layer is out of flow, so the content — not the background —
// decides the size. That is SwiftUI's `.background`: the base view lays out as
// if the background were not there, and the background fills behind it. Pinned
// to the lowest stacking level so nothing inside the content can slip under it.
const layerStyle = computed(() => ({
  position: 'absolute' as const,
  inset: '0',
  zIndex: 0,
  display: 'flex',
  pointerEvents: 'none' as const,
  ...alignMap[props.alignment],
}))

// The content sits one stacking level above the background, decided here rather
// than by source order.
const contentStyle = { position: 'relative' as const, zIndex: 1 }
</script>

<template>
  <div :style="style">
    <div class="swift-background-layer" :style="layerStyle">
      <slot name="background" />
    </div>
    <!-- The content sits above the background in its own stacking level, so
         the two never fight over paint order regardless of source position. -->
    <div class="swift-background-content" :style="contentStyle"><slot /></div>
  </div>
</template>
