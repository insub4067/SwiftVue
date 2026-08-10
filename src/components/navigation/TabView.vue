<script lang="ts">
export interface TabItem {
  id: string
  label: string
  icon?: string
  /** SwiftUI's .badge() — 0 and '' show nothing, as they do on iOS */
  badge?: number | string
}

export interface TabViewProps extends ModifierProps {
  tabs: TabItem[]
  modelValue?: string
}
</script>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import NavPane from './NavPane'


const props = defineProps<TabViewProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const modifierStyle = useModifiers(props)

const activeTab = computed({
  get: () => props.modelValue ?? props.tabs[0]?.id ?? '',
  set: (v) => emit('update:modelValue', v),
})

/**
 * Which tabs have ever been selected. SwiftUI builds a tab the first time
 * you open it and keeps it from then on, so a tab you come back to is the
 * one you left — same navigation depth, same scroll position, same half
 * typed field. Rendering only the selected tab threw all of that away every
 * time the user looked at something else.
 *
 * First selection rather than eagerly, because a tab nobody opens should
 * cost nothing — and because mounting all of them would run every tab's
 * `onAppear` at startup.
 */
const opened = reactive(new Set<string>())
watch(activeTab, (id) => { if (id) opened.add(id) }, { immediate: true })

// A tab removed from `tabs` is gone, not merely hidden — keeping its pane
// alive would leak one per removal and leave it answering to an id the tab
// bar no longer shows.
watch(() => props.tabs, (tabs) => {
  const live = new Set(tabs.map(t => t.id))
  for (const id of opened) if (!live.has(id)) opened.delete(id)
}, { deep: true })

const panes = computed(() => props.tabs.filter(tab => opened.has(tab.id)))

// iOS hides an empty badge rather than drawing a dot with nothing in it.
function badgeOf(tab: TabItem): string | null {
  const { badge } = tab
  if (badge == null || badge === '' || badge === 0) return null
  return typeof badge === 'number' && badge > 99 ? '99+' : String(badge)
}

// The capped text loses the real count, so assistive tech gets the number
// itself. Uncapped badges are already exact and need no second reading.
function badgeLabel(tab: TabItem): string | undefined {
  return typeof tab.badge === 'number' && tab.badge > 99 ? String(tab.badge) : undefined
}

const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  flexDirection: 'column' as const,
  height: modifierStyle.value.height ?? '100%',
}))
</script>

<template>
  <div :style="style">
    <div class="tab-content">
      <!--
        One panel per tab that has been opened, all but the selected one
        display:none — which is what takes it out of the accessibility tree
        as well as out of view, so a screen reader never reaches a tab the
        user is not on.
      -->
      <div
        v-for="tab in panes"
        v-show="tab.id === activeTab"
        :key="tab.id"
        class="tab-panel"
        role="tabpanel"
        :aria-labelledby="`tab-${tab.id}`"
      >
        <NavPane :active="tab.id === activeTab">
          <slot :name="tab.id" />
        </NavPane>
      </div>
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
        <span class="tab-icon-slot">
          <span v-if="tab.icon" class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
          <span
            v-if="badgeOf(tab)"
            class="tab-badge"
            :aria-label="badgeLabel(tab)"
          >{{ badgeOf(tab) }}</span>
        </span>
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tab-content {
  flex: 1;
  overflow-y: auto;
  /* A percentage height inside a panel used to resolve against this box,
     back when the tab's content was its only child. `min-height: 0` keeps
     the flex item from growing past the row, and the panel below restores
     the full height the content still expects. */
  min-height: 0;
}
.tab-panel {
  height: 100%;
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
.tab-icon-slot { position: relative; display: inline-flex; }
.tab-icon { font-size: 24px; line-height: 1; }
.tab-label { font-size: 10px; font-weight: 500; }

/* Sits on the icon's trailing top corner, as it does on iOS. Reads left to
   right, so it grows away from the icon instead of over it. */
.tab-badge {
  position: absolute;
  top: -4px;
  inset-inline-start: 100%;
  transform: translateX(-40%);
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 9px;
  background: var(--swift-red);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 17px;
  text-align: center;
  white-space: nowrap;
}
</style>
