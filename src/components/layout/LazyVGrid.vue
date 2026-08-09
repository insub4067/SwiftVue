<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'
import { resolveTracks, type GridItem } from '../../utils/grid'

interface Props extends ModifierProps {
  columns?: number | GridItem[]
  spacing?: number
  alignment?: 'leading' | 'center' | 'trailing'
}

const props = withDefaults(defineProps<Props>(), {
  columns: 2,
  spacing: 8,
  alignment: 'center',
})

const alignMap = { leading: 'start', center: 'center', trailing: 'end' }

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  display: 'grid',
  gridTemplateColumns: resolveTracks(props.columns),
  gap: `${props.spacing}px`,
  justifyItems: alignMap[props.alignment],
  // Like SwiftUI, the grid spans the available width. Sizing to its own
  // content instead would inflate ancestors and break adaptive tracks.
  width: modifierStyle.value.width ?? '100%',
  minWidth: modifierStyle.value.minWidth ?? 0,
}))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
