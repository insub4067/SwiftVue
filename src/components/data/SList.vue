<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  items?: any[]
  listStyle?: 'plain' | 'insetGrouped' | 'grouped' | 'sidebar'
}

const props = withDefaults(defineProps<Props>(), {
  listStyle: 'insetGrouped',
})

const modifierStyle = useModifiers(props)
const style = computed(() => modifierStyle.value)

const listClass = computed(() => `swift-list swift-list--${props.listStyle}`)
</script>

<template>
  <div :class="listClass" :style="style">
    <template v-if="items">
      <div v-for="(item, index) in items" :key="index" class="swift-list-row">
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
