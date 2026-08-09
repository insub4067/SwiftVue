<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline'
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 8,
  alignment: 'center',
})

const alignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end', firstTextBaseline: 'baseline' }

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  display: 'flex',
  flexDirection: 'row' as const,
  alignItems: alignMap[props.alignment],
  gap: `${props.spacing}px`,
}))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
