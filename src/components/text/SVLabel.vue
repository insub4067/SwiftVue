<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  systemImage?: string
  iconColor?: string
  /**
   * Renders a real <label> bound to this control id. SwiftUI's Label is just
   * an icon beside text, so without this it stays a <span> — a <label> that
   * labels nothing is a lie to assistive tech.
   */
  for?: string
}

const props = defineProps<Props>()
const modifierStyle = useModifiers(props)

const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
}))
</script>

<template>
  <label v-if="props.for" :for="props.for" :style="style">
    <span v-if="systemImage" aria-hidden="true" :style="{ color: iconColor }">{{ systemImage }}</span>
    <span><slot /></span>
  </label>
  <span v-else :style="style">
    <span v-if="systemImage" aria-hidden="true" :style="{ color: iconColor }">{{ systemImage }}</span>
    <span><slot /></span>
  </span>
</template>
