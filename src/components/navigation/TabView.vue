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
const tabBarStyle = computed(() => ({
  '--swift-tab-count': String(Math.max(props.tabs.length, 1)),
  '--swift-tab-index': String(Math.max(props.tabs.findIndex(tab => tab.id === activeTab.value), 0)),
}))

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
}, {
  position: 'relative',
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
    <nav
      class="tab-bar tab-bar--floating swift-liquid-glass"
      role="tablist"
      aria-label="Tabs"
      :style="tabBarStyle"
    >
      <span class="tab-selection-indicator" aria-hidden="true" />
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
          <!--
            A per-tab icon slot named `<id>-icon`, so a tab can draw its own
            mark — an inline SVG, a logo — instead of a text glyph. The slot
            hands back the tab and whether it is selected, so the custom icon
            can follow the active colour like the glyph does. With no slot the
            `icon` string renders as before, so existing tab bars are unchanged.
          -->
          <slot :name="`${tab.id}-icon`" :tab="tab" :active="activeTab === tab.id">
            <span v-if="tab.icon" class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
          </slot>
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
  --swift-tab-bar-clearance: calc(82px + env(safe-area-inset-bottom, 0px));
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
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: max(8px, calc(env(safe-area-inset-bottom, 0px) * 0.5));
  display: flex;
  width: min(calc(100% - 40px), 640px);
  min-height: 64px;
  overflow: hidden;
  padding: 5px 6px;
  border-radius: 32px;
  transform: translateX(-50%);
}
.tab-item {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  min-height: 52px;
  padding: 4px 6px;
  border: none;
  border-radius: 26px;
  background: none;
  cursor: pointer;
  color: var(--swift-secondary);
  transition: color var(--swift-transition), background-color var(--swift-transition), transform var(--swift-transition);
  font-family: inherit;
}
.tab-item:not(.active):hover { background-color: var(--swift-fill); }
.tab-item:active { transform: scale(0.97); }
.tab-item.active {
  color: var(--swift-primary);
}
.tab-item:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.tab-icon-slot { position: relative; display: inline-flex; }
.tab-icon { font-size: 24px; line-height: 1; }
.tab-label { font-size: 10px; font-weight: 500; }

.tab-selection-indicator {
  position: absolute;
  z-index: 0;
  top: 5px;
  bottom: 5px;
  inset-inline-start: 6px;
  width: calc((100% - 12px) / var(--swift-tab-count));
  border-radius: 26px;
  background-color: var(--swift-secondary-fill);
  pointer-events: none;
  transform: translateX(calc(var(--swift-tab-index) * 100%));
  transition: transform 420ms cubic-bezier(0.22, 1.12, 0.36, 1);
  will-change: transform;
}

.tab-selection-indicator:dir(rtl) {
  transform: translateX(calc(var(--swift-tab-index) * -100%));
}

@media (prefers-reduced-motion: reduce) {
  .tab-selection-indicator { transition-duration: 0.01ms; }
}

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
