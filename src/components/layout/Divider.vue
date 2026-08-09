<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ color?: string; thickness?: number }>()

const style = computed(() => ({
  height: `${props.thickness ?? 1}px`,
  backgroundColor: props.color ?? 'var(--swift-separator)',
  width: '100%',
  flexShrink: 0,
}))
</script>

<template>
  <hr :style="style" />
</template>

<style scoped>
hr { border: none; margin: 0; }
</style>
