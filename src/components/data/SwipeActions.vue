<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface SwipeAction {
  label: string
  id?: string | number
  systemImage?: string
  role?: 'destructive'
  /** background of the action's slab; defaults by role */
  tint?: string
}

export interface SwipeActionsProps extends ModifierProps {
  /** revealed by swiping the row towards the trailing edge — iOS Delete */
  trailing?: SwipeAction[]
  /** revealed by swiping towards the leading edge */
  leading?: SwipeAction[]
  /**
   * SwiftUI's `allowsFullSwipe`. A swipe past most of the row runs the first
   * action outright instead of parking the row open.
   */
  allowsFullSwipe?: boolean
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'
import { resolveColor } from '../../utils/theme'
import { useSwipe } from '../../composables/useSwipe'

const props = withDefaults(defineProps<SwipeActionsProps>(), {
  trailing: () => [],
  leading: () => [],
  allowsFullSwipe: true,
})
const emit = defineEmits<{ select: [action: SwipeAction] }>()

const root = ref<HTMLElement | null>(null)
const offset = ref(0)          // where the row currently sits, in px
const dragging = ref(false)
const actionsId = `swipe-actions-${useId()}`

const ACTION_WIDTH = 84
const FULL_SWIPE_FRACTION = 0.6

const trailingWidth = computed(() => props.trailing.length * ACTION_WIDTH)
const leadingWidth = computed(() => props.leading.length * ACTION_WIDTH)

const openSide = computed<'leading' | 'trailing' | null>(() => {
  if (offset.value < -1) return 'trailing'
  if (offset.value > 1) return 'leading'
  return null
})

function tintOf(action: SwipeAction) {
  return resolveColor(action.tint ?? (action.role === 'destructive' ? 'red' : 'blue'))
}

function close() {
  offset.value = 0
}

function run(action: SwipeAction) {
  emit('select', action)
  close()
}

function rowWidth() {
  return root.value?.getBoundingClientRect().width ?? 0
}

useSwipe(root, {
  threshold: 24,
  tolerance: 32,
  onMove({ x }) {
    if (props.disabled) return
    // Clamp to what there is to reveal, with a little give so the row feels
    // attached to the finger rather than hitting a wall.
    const min = trailingWidth.value ? -(trailingWidth.value + 40) : 0
    const max = leadingWidth.value ? leadingWidth.value + 40 : 0
    dragging.value = true
    offset.value = Math.min(max, Math.max(min, x))
  },
  onCancel() {
    dragging.value = false
    settle()
  },
  onSwipe() {
    dragging.value = false
    settle()
  },
})

/**
 * Where the row lands when the finger lifts: fully open, fully closed, or —
 * if it went far enough — straight into the first action.
 */
function settle() {
  const travelled = Math.abs(offset.value)
  const width = rowWidth()
  // A row with no measured width — not laid out yet, or display:none — would
  // make every threshold zero and turn the smallest drag into a full swipe,
  // which for a destructive first action is the worst possible default.
  const canFullSwipe = props.allowsFullSwipe && width > 0
  const full = width * FULL_SWIPE_FRACTION

  if (offset.value < 0 && props.trailing.length) {
    if (canFullSwipe && travelled >= full) return run(props.trailing[0])
    offset.value = travelled > trailingWidth.value / 2 ? -trailingWidth.value : 0
    return
  }
  if (offset.value > 0 && props.leading.length) {
    if (canFullSwipe && travelled >= full) return run(props.leading[0])
    offset.value = travelled > leadingWidth.value / 2 ? leadingWidth.value : 0
    return
  }
  offset.value = 0
}

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  position: 'relative' as const,
  display: 'block',
  overflow: 'hidden',
  width: modifierStyle.value.width ?? '100%',
}))

const contentStyle = computed(() => ({
  transform: `translateX(${offset.value}px)`,
  transition: dragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
}))

defineExpose({ close, offset })
</script>

<template>
  <div ref="root" class="swipe-row" :style="style">
    <!--
      Both slabs sit under the content. Only the side being swiped towards is
      uncovered, so they can share the space without a z-index fight.
    -->
    <div v-if="leading.length" class="swipe-slab swipe-slab--leading" aria-hidden="true">
      <button
        v-for="action in leading"
        :key="action.id ?? action.label"
        type="button"
        tabindex="-1"
        class="swipe-action"
        :style="{ backgroundColor: tintOf(action), width: `${ACTION_WIDTH}px` }"
        @click="run(action)"
      >
        <span v-if="action.systemImage" class="swipe-action-icon">{{ action.systemImage }}</span>
        <span>{{ action.label }}</span>
      </button>
    </div>

    <div v-if="trailing.length" class="swipe-slab swipe-slab--trailing" aria-hidden="true">
      <button
        v-for="action in trailing"
        :key="action.id ?? action.label"
        type="button"
        tabindex="-1"
        class="swipe-action"
        :style="{ backgroundColor: tintOf(action), width: `${ACTION_WIDTH}px` }"
        @click="run(action)"
      >
        <span v-if="action.systemImage" class="swipe-action-icon">{{ action.systemImage }}</span>
        <span>{{ action.label }}</span>
      </button>
    </div>

    <div class="swipe-content" :style="contentStyle" @click="openSide && close()">
      <slot />
    </div>

    <!--
      A swipe is not reachable by keyboard or screen reader, so the same
      actions are offered as real buttons. Visually hidden until focused,
      which is how a skip link behaves.
    -->
    <div v-if="leading.length || trailing.length" :id="actionsId" class="swipe-fallback">
      <button
        v-for="action in [...leading, ...trailing]"
        :key="`a11y-${action.id ?? action.label}`"
        type="button"
        class="swipe-fallback-button"
        @click="run(action)"
      >{{ action.label }}</button>
    </div>
  </div>
</template>

<style scoped>
.swipe-row { touch-action: pan-y; }

.swipe-slab {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
}
.swipe-slab--leading { left: 0; }
.swipe-slab--trailing { right: 0; }

.swipe-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
}
.swipe-action-icon { font-size: 18px; }

.swipe-content {
  position: relative;
  background: var(--swift-secondary-background);
  will-change: transform;
}

.swipe-fallback {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.swipe-fallback:focus-within {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip-path: none;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: var(--swift-secondary-background);
}
.swipe-fallback-button {
  font-family: inherit;
  font-size: 15px;
  padding: 6px 12px;
  border: 1px solid var(--swift-separator);
  border-radius: 8px;
  background: none;
  color: var(--swift-label);
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .swipe-content { transition-duration: 0.01ms !important; }
}
</style>
