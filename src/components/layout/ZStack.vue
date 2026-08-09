<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  alignment?: 'center' | 'leading' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'
}

const props = withDefaults(defineProps<Props>(), { alignment: 'center' })

// Children share one grid cell, so they are placed by justify-items
// (horizontal) and align-items (vertical). justify-content/align-content
// would move the track instead — that swapped `leading` with `top`.
const posMap: Record<string, { justifyItems: string; alignItems: string }> = {
  center: { justifyItems: 'center', alignItems: 'center' },
  leading: { justifyItems: 'start', alignItems: 'center' },
  trailing: { justifyItems: 'end', alignItems: 'center' },
  top: { justifyItems: 'center', alignItems: 'start' },
  bottom: { justifyItems: 'center', alignItems: 'end' },
  topLeading: { justifyItems: 'start', alignItems: 'start' },
  topTrailing: { justifyItems: 'end', alignItems: 'start' },
  bottomLeading: { justifyItems: 'start', alignItems: 'end' },
  bottomTrailing: { justifyItems: 'end', alignItems: 'end' },
}

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  position: 'relative' as const,
  display: 'grid' as const,
  ...posMap[props.alignment],
}))
</script>

<template>
  <div :style="style">
    <slot />
  </div>
</template>

<style scoped>
div :deep(> *) {
  grid-area: 1 / 1;
}
</style>
