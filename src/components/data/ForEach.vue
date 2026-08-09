<script setup lang="ts" generic="T">
defineProps<{
  items: T[]
  keyPath?: keyof T
}>()

defineSlots<{
  default: (props: { item: T; index: number }) => any
}>()
</script>

<template>
  <template v-for="(item, index) in items" :key="keyPath ? (item as any)[keyPath] : index">
    <slot :item="item" :index="index" />
  </template>
</template>
