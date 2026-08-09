<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ minLength?: number }>()

const style = computed(() => ({
  flexGrow: 1,
  flexShrink: 0,
  minWidth: props.minLength ? `${props.minLength}px` : undefined,
  minHeight: props.minLength ? `${props.minLength}px` : undefined,
}))
</script>

<template>
  <div :style="style" />
</template>
