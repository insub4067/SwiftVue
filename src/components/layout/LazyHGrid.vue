<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { resolveTracks, type GridItem } from '../../utils/grid'

interface Props extends ModifierProps {
  rows?: number | GridItem[]
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), {
  rows: 2,
  spacing: 8,
  alignment: 'center',
})

const alignMap = { top: 'start', center: 'center', bottom: 'end' }

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'grid',
  gridTemplateRows: resolveTracks(props.rows),
  // Columns are generated as items are added — this is what makes it scroll
  // sideways inside a horizontal ScrollView.
  gridAutoFlow: 'column' as const,
  gridAutoColumns: 'max-content',
  gap: `${props.spacing}px`,
  alignItems: alignMap[props.alignment],
}))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
