<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  axes?: 'vertical' | 'horizontal' | 'both'
  showsIndicators?: boolean
  /**
   * SwiftUI's `.refreshable`: pull down from the top to run this, with a
   * spinner shown until the returned promise settles.
   */
  refreshable?: () => unknown | Promise<unknown>
}

const props = withDefaults(defineProps<Props>(), {
  axes: 'vertical',
  showsIndicators: true,
})

const modifierStyle = useModifiers(props)
const scrollsHorizontally = computed(() => props.axes === 'horizontal' || props.axes === 'both')
const scrollsVertically = computed(() => props.axes === 'vertical' || props.axes === 'both')

const el = ref<HTMLElement | null>(null)
const pull = ref(0)
const refreshing = ref(false)
const dragging = ref(false)

const REFRESH_TRIGGER = 60
const REFRESH_HOLD = 52

/** Programmatic counterpart of the pull gesture. */
async function refresh() {
  if (!props.refreshable || refreshing.value) return
  refreshing.value = true
  pull.value = REFRESH_HOLD
  try {
    await props.refreshable()
  } finally {
    refreshing.value = false
    pull.value = 0
  }
}
defineExpose({ refresh })

let startY = 0
let armed = false

function onTouchStart(e: TouchEvent) {
  if (!props.refreshable || !scrollsVertically.value || refreshing.value) return
  if ((el.value?.scrollTop ?? 1) <= 0) {
    startY = e.touches[0].clientY
    armed = true
  }
}

function onTouchMove(e: TouchEvent) {
  if (!armed || refreshing.value) return
  const dy = e.touches[0].clientY - startY
  if (dy > 0 && (el.value?.scrollTop ?? 1) <= 0) {
    e.preventDefault() // take over from native overscroll
    dragging.value = true
    pull.value = Math.min(110, dy * 0.5)
  } else {
    dragging.value = false
    pull.value = 0
  }
}

function onTouchEnd() {
  if (!armed) return
  armed = false
  dragging.value = false
  if (pull.value >= REFRESH_TRIGGER) void refresh()
  else pull.value = 0
}

const style = computed(() => composeStyle(
  modifierStyle.value,
  {
    flex: '1 1 0%',
    // A horizontal scroller must take its width from the parent. Left to
    // size itself it resolves to its content width, which both inflates
    // ancestors and leaves nothing to scroll.
    ...(scrollsHorizontally.value ? { width: '100%' } : {}),
    minWidth: 0,
  },
  {
    // The axes prop is the component's own answer to what scrolls. A view
    // that does not scroll on the axis it was told to is not a ScrollView.
    overflowX: (scrollsHorizontally.value ? 'auto' : 'hidden') as any,
    overflowY: (scrollsVertically.value ? 'auto' : 'hidden') as any,
  },
))
</script>

<template>
  <div
    ref="el"
    :style="style"
    :class="{ 'hide-scrollbar': !showsIndicators }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div
      v-if="refreshable"
      class="swift-refresh"
      :class="{ 'swift-refresh--settling': !dragging }"
      :style="{ height: `${refreshing ? REFRESH_HOLD : pull}px` }"
      aria-hidden="true"
    >
      <span
        class="swift-refresh-spinner"
        :class="{ spinning: refreshing }"
        :style="refreshing ? undefined : {
          opacity: Math.min(1, pull / REFRESH_TRIGGER),
          transform: `rotate(${pull * 3}deg)`,
        }"
      />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.hide-scrollbar { scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }

.swift-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.swift-refresh--settling { transition: height 0.25s ease; }

.swift-refresh-spinner {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid var(--swift-fill);
  border-top-color: var(--swift-secondary);
  flex-shrink: 0;
}
.swift-refresh-spinner.spinning {
  animation: swift-refresh-spin 0.8s linear infinite;
}
@keyframes swift-refresh-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .swift-refresh--settling { transition-duration: 0.01ms; }
  .swift-refresh-spinner.spinning { animation-duration: 2s; }
}
</style>
