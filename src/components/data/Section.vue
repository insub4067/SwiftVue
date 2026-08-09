<script lang="ts">
// module scope so ids stay unique across instances
let uid = 0

export interface SectionProps {
  header?: string
  footer?: string
  /** DisclosureGroup behavior: the header becomes a button that folds the rows */
  collapsible?: boolean
  /** optional v-model:expanded; left unbound the section manages itself */
  expanded?: boolean
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<SectionProps>(), { expanded: undefined })
const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()

// Controlled when the prop is bound, self-managed otherwise.
const internal = ref(props.expanded ?? true)
watch(() => props.expanded, (value) => {
  if (value !== undefined) internal.value = value
})
const isExpanded = computed(() => props.expanded ?? internal.value)

const bodyId = `swift-section-body-${uid++}`

function toggle() {
  if (!props.collapsible) return
  const next = !isExpanded.value
  internal.value = next
  emit('update:expanded', next)
}
</script>

<template>
  <section class="swift-section">
    <button
      v-if="collapsible"
      type="button"
      class="section-header section-header--button"
      :aria-expanded="isExpanded"
      :aria-controls="bodyId"
      @click="toggle"
    >
      <span class="section-header-text"><slot name="header">{{ header }}</slot></span>
      <span class="section-chevron" :class="{ open: isExpanded }" aria-hidden="true">›</span>
    </button>
    <div v-else-if="header || $slots.header" class="section-header">
      <span class="section-header-text"><slot name="header">{{ header }}</slot></span>
    </div>

    <div :id="bodyId" class="section-body" :class="{ collapsed: collapsible && !isExpanded }">
      <div class="section-card">
        <slot />
      </div>
    </div>

    <p v-if="footer || $slots.footer" class="section-footer">
      <slot name="footer">{{ footer }}</slot>
    </p>
  </section>
</template>

<style scoped>
.swift-section {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 16px 7px;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--swift-secondary-label);
}
.section-header--button {
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  width: 100%;
}
.section-header--button:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.section-chevron {
  font-size: 18px;
  line-height: 1;
  transition: transform var(--swift-transition);
  color: var(--swift-tertiary-label);
}
.section-chevron.open { transform: rotate(90deg); }

/* 1fr→0fr grid collapse: animates to the content's own height, no magic numbers */
.section-body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s ease;
}
.section-body.collapsed { grid-template-rows: 0fr; }
.section-card {
  min-height: 0;
  overflow: hidden;
  background: var(--swift-secondary-grouped-background);
  border-radius: 10px;
}
.section-card :slotted(.swift-list-row) {
  padding: 11px 16px;
  border-bottom: 1px solid var(--swift-separator);
}
.section-card :slotted(.swift-list-row:last-child) { border-bottom: none; }
/* NavigationLinks in a Section read as iOS settings rows */
.section-card :slotted(.nav-link) { border-bottom: 1px solid var(--swift-separator); }
.section-card :slotted(.nav-link:last-child) { border-bottom: none; }

.section-footer {
  margin: 7px 0 0;
  padding: 0 16px;
  font-size: 13px;
  line-height: 18px;
  color: var(--swift-secondary-label);
}

@media (prefers-reduced-motion: reduce) {
  .section-body, .section-chevron { transition-duration: 0.01ms; }
}
</style>
