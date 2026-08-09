<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  alignment?: 'center' | 'leading' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'
}

const props = withDefaults(defineProps<Props>(), { alignment: 'center' })

const posMap: Record<string, { justifyContent: string; alignItems: string }> = {
  center: { justifyContent: 'center', alignItems: 'center' },
  leading: { justifyContent: 'center', alignItems: 'flex-start' },
  trailing: { justifyContent: 'center', alignItems: 'flex-end' },
  top: { justifyContent: 'flex-start', alignItems: 'center' },
  bottom: { justifyContent: 'flex-end', alignItems: 'center' },
  topLeading: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  topTrailing: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  bottomLeading: { justifyContent: 'flex-end', alignItems: 'flex-start' },
  bottomTrailing: { justifyContent: 'flex-end', alignItems: 'flex-end' },
}

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  position: 'relative' as const,
  display: 'grid' as const,
  placeItems: 'center',
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
