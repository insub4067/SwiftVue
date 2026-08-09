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
const style = computed(() => composeStyle(
  modifierStyle.value,
  { gap: `${props.spacing}px` },
  {
    display: 'flex',
    flexDirection: 'column' as const,
    // the dedicated prop, so more specific than frame.alignment
    alignItems: alignMap[props.alignment],
  },
))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
