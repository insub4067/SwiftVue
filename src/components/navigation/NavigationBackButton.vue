<script lang="ts">
export interface NavigationBackButtonProps {
  visible?: boolean
}
</script>

<script setup lang="ts">
withDefaults(defineProps<NavigationBackButtonProps>(), {
  visible: true,
})

defineEmits<{
  back: []
}>()
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="swift-navigation-back-button"
    aria-label="Back"
    @click="$emit('back')"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  </button>
</template>

<style scoped>
.swift-navigation-back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--swift-separator);
  border-radius: 50%;
  background: var(--swift-background);
  box-shadow: 0 4px 12px rgb(0 0 0 / 16%);
  color: var(--swift-primary);
  cursor: pointer;
}

.swift-navigation-back-button svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

[dir="rtl"] .swift-navigation-back-button svg { transform: scaleX(-1); }

.swift-navigation-back-button:active { transform: scale(0.96); }

.swift-navigation-back-button:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
</style>
