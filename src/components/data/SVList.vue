<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface ListProps<T> extends ModifierProps {
  items?: T[]
  listStyle?: 'plain' | 'insetGrouped' | 'grouped' | 'sidebar'
  /**
   * Field identifying each row. Without it rows are keyed by position, so
   * sorting or inserting hands a row's DOM — and any state inside it — to a
   * different item.
   */
  keyPath?: keyof T
}
</script>

<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { useModifiers } from '../../utils/modifiers'

const props = withDefaults(defineProps<ListProps<T>>(), {
  listStyle: 'insetGrouped',
})

function rowKey(item: T, index: number) {
  if (!props.keyPath) return index
  const key = item?.[props.keyPath]
  return key as string | number ?? index
}

const modifierStyle = useModifiers(props)
const style = computed(() => modifierStyle.value)

const listClass = computed(() => `swift-list swift-list--${props.listStyle}`)
</script>

<template>
  <div :class="listClass" :style="style">
    <template v-if="items">
      <div v-for="(item, index) in items" :key="rowKey(item, index)" class="swift-list-row">
        <slot :item="item" :index="index" />
      </div>
    </template>
    <slot v-else />
  </div>
</template>

<style scoped>
.swift-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.swift-list--plain .swift-list-row {
  padding: 11px 16px;
  border-bottom: 1px solid var(--swift-separator);
}
.swift-list--plain .swift-list-row:last-child { border-bottom: none; }

.swift-list--insetGrouped {
  background: var(--swift-secondary-grouped-background);
  border-radius: 10px;
  overflow: hidden;
  margin: 0 16px;
}
.swift-list--insetGrouped .swift-list-row {
  padding: 11px 16px;
  border-bottom: 1px solid var(--swift-separator);
}
.swift-list--insetGrouped .swift-list-row:last-child { border-bottom: none; }

.swift-list--grouped {
  background: var(--swift-secondary-grouped-background);
}
.swift-list--grouped .swift-list-row {
  padding: 11px 16px;
  border-bottom: 1px solid var(--swift-separator);
}

.swift-list--sidebar {
  padding: 8px;
}
.swift-list--sidebar .swift-list-row {
  padding: 8px 12px;
  border-radius: 8px;
  transition: background var(--swift-transition);
}
.swift-list--sidebar .swift-list-row:hover {
  background: var(--swift-fill);
}
</style>
