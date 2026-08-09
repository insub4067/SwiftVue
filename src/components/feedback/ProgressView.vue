<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  value?: number
  total?: number
  progressViewStyle?: 'circular' | 'linear'
  tint?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  progressViewStyle: 'circular',
  tint: 'var(--swift-primary)',
})

const modifierStyle = useModifiers(props)
const style = computed(() => modifierStyle.value)
const isIndeterminate = computed(() => props.value == null)

// A non-positive total has no meaningful fraction, and a value outside
// [0, total] would otherwise render a negative or overlong bar.
const pct = computed(() => {
  const { value, total = 1 } = props
  if (value == null || !Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(100, Math.max(0, (value / total) * 100))
})
</script>

<template>
  <div
    v-if="progressViewStyle === 'circular'"
    class="circular"
    :style="style"
    role="progressbar"
    :aria-valuenow="isIndeterminate ? undefined : pct"
    :aria-valuemin="isIndeterminate ? undefined : 0"
    :aria-valuemax="isIndeterminate ? undefined : 100"
    :aria-label="label ?? 'Loading'"
  >
    <svg viewBox="0 0 36 36" :class="{ spin: isIndeterminate }">
      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--swift-fill)" stroke-width="3" />
      <circle
        cx="18" cy="18" r="15" fill="none" :stroke="tint" stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="isIndeterminate ? '25 69' : `${pct * 0.94} 94`"
        transform="rotate(-90 18 18)"
      />
    </svg>
    <span v-if="$slots.default" class="circular-label"><slot /></span>
  </div>

  <div
    v-else
    class="linear"
    :style="style"
    role="progressbar"
    :aria-valuenow="isIndeterminate ? undefined : pct"
    :aria-valuemin="isIndeterminate ? undefined : 0"
    :aria-valuemax="isIndeterminate ? undefined : 100"
    :aria-label="label ?? 'Loading'"
  >
    <div class="track">
      <div
        :class="['bar', { indeterminate: isIndeterminate }]"
        :style="{ width: isIndeterminate ? '30%' : `${pct}%`, backgroundColor: tint }"
      />
    </div>
    <span v-if="$slots.default" class="linear-label"><slot /></span>
  </div>
</template>

<style scoped>
.circular {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.circular svg { width: 36px; height: 36px; }
.circular-label { font-size: 13px; color: var(--swift-secondary-label); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.linear {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.track {
  height: 4px;
  border-radius: 2px;
  background: var(--swift-fill);
  overflow: hidden;
}
.bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.bar.indeterminate {
  animation: slide 1.5s ease-in-out infinite;
}
.linear-label { font-size: 13px; color: var(--swift-secondary-label); }
@keyframes slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
</style>
