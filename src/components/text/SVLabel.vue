<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  systemImage?: string
  iconColor?: string
}

const props = defineProps<Props>()
const modifierStyle = useModifiers(props)

const style = computed(() => ({
  ...modifierStyle.value,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
}))
</script>

<template>
  <label :style="style">
    <span v-if="systemImage" :style="{ color: iconColor }">{{ systemImage }}</span>
    <span><slot /></span>
  </label>
</template>
