<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom' | 'firstTextBaseline'
  /**
   * Web addition with no SwiftUI counterpart: let the row flow onto more lines
   * instead of overflowing a narrow viewport.
   */
  wrap?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 8,
  alignment: 'center',
})

const alignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end', firstTextBaseline: 'baseline' }

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(
  modifierStyle.value,
  { gap: `${props.spacing}px` },
  {
    display: 'flex',
    flexDirection: 'row' as const,
    // the dedicated prop, so more specific than frame.alignment
    alignItems: alignMap[props.alignment],
    ...(props.wrap ? { flexWrap: 'wrap' as const } : {}),
  },
))
</script>

<template>
  <div :style="style"><slot /></div>
</template>
