<script lang="ts">
export interface TabItem {
  id: string
  label: string
  icon?: string
}

export interface TabViewProps extends ModifierProps {
  tabs: TabItem[]
  modelValue?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'


const props = defineProps<TabViewProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const modifierStyle = useModifiers(props)

const activeTab = computed({
  get: () => props.modelValue ?? props.tabs[0]?.id ?? '',
  set: (v) => emit('update:modelValue', v),
})

const style = computed(() => ({
  ...modifierStyle.value,
  display: 'flex',
  flexDirection: 'column' as const,
  height: modifierStyle.value.height ?? '100%',
}))
</script>

<template>
  <div :style="style">
    <div class="tab-content" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
      <slot :name="activeTab" />
    </div>
    <nav class="tab-bar" role="tablist" aria-label="Tabs">
      <button
        type="button"
        v-for="tab in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span v-if="tab.icon" class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tab-content {
  flex: 1;
  overflow-y: auto;
}
.tab-bar {
  display: flex;
  border-top: 1px solid var(--swift-separator);
  background: var(--swift-secondary-background);
  padding: 4px 0;
  padding-bottom: env(safe-area-inset-bottom, 4px);
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--swift-secondary);
  transition: color var(--swift-transition);
  font-family: inherit;
}
.tab-item.active { color: var(--swift-primary); }
.tab-item:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.tab-icon { font-size: 24px; line-height: 1; }
.tab-label { font-size: 10px; font-weight: 500; }
</style>
