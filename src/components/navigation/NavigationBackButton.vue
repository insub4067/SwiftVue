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
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 50%;
  background-color: var(--swift-navigation-glass);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  backdrop-filter: blur(18px) saturate(160%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 58%),
    inset 0 -1px 0 rgb(0 0 0 / 8%),
    0 4px 12px rgb(0 0 0 / 16%);
  color: var(--swift-label);
  cursor: pointer;
  transition: transform var(--swift-transition), background-color var(--swift-transition);
}

.swift-navigation-back-button::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    145deg,
    rgb(255 255 255 / 38%) 0%,
    rgb(255 255 255 / 8%) 42%,
    rgb(255 255 255 / 2%) 70%
  );
  content: '';
  pointer-events: none;
}

.swift-navigation-back-button svg {
  position: relative;
  z-index: 1;
  width: 26px;
  height: 26px;
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

@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .swift-navigation-back-button { background-color: var(--swift-secondary-background); }
}
</style>
