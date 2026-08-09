<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  spacing?: number
  alignment?: 'leading' | 'center' | 'trailing'
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 8,
  alignment: 'center',
})

const alignMap = { leading: 'flex-start', center: 'center', trailing: 'flex-end' }

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: alignMap[props.alignment],
  gap: `${props.spacing}px`,
}))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
