<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface GaugeProps extends ModifierProps {
  value: number
  /** SwiftUI's `in:` range */
  min?: number
  max?: number
  /**
   * `circular` is SwiftUI's accessoryCircular dial; `linear` is the
   * capacity bar. Both read the same to assistive tech.
   */
  gaugeStyle?: 'circular' | 'linear'
  /** shown under the dial, or above the bar */
  label?: string
  /** what the needle reads — defaults to the value itself */
  currentValueLabel?: string
  /** end captions on a linear gauge; omit for none */
  minimumValueLabel?: string
  maximumValueLabel?: string
  /** diameter of the circular dial, in px */
  size?: number
  tint?: string
}
</script>

<script setup lang="ts">
import { computed, onMounted, useAttrs } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'
import { warnDev } from '../../utils/warn'
import { resolveColor } from '../../utils/theme'

const props = withDefaults(defineProps<GaugeProps>(), {
  min: 0,
  max: 1,
  gaugeStyle: 'circular',
  size: 64,
})

const modifierStyle = useModifiers(props)
const attrs = useAttrs()

// An inverted or empty range has no meaningful fraction, and a value outside
// it would otherwise sweep past the end of the dial.
const fraction = computed(() => {
  const { value, min, max } = props
  if (![value, min, max].every(Number.isFinite) || max <= min) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
})

// WAI-ARIA: aria-valuenow on a meter must lie within [min, max], so the
// number announced matches the one drawn. The reading the app passed in is
// still worth having — it goes to aria-valuetext, which is free-form.
// https://www.w3.org/TR/wai-aria/#meter
const clampedValue = computed(() => {
  const { value, min, max } = props
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), Math.max(min, max))
})

const valueText = computed(() => props.currentValueLabel ?? String(props.value))

// A meter needs an accessible name. `label` is the way to give it one; a
// fallthrough aria-label or aria-labelledby counts too.
onMounted(() => {
  if (props.label || attrs['aria-label'] || attrs['aria-labelledby']) return
  warnDev(
    'Gauge: a role="meter" needs an accessible name. Pass `label`, or an ' +
    'aria-label if the name should not be visible.',
  )
})

const percent = computed(() => fraction.value * 100)
const tintColor = computed(() => resolveColor(props.tint ?? 'accent'))

// The dial is an open ring: it leaves a 90° gap at the bottom, so full and
// empty are visibly different from each other and from a progress circle.
const SWEEP = 270
const RADIUS = 42 // in the 100×100 viewBox the SVG draws in
const arcLength = (Math.PI * 2 * RADIUS) * (SWEEP / 360)

const trackDash = computed(() => `${arcLength} ${Math.PI * 2 * RADIUS}`)
const valueDash = computed(() => `${arcLength * fraction.value} ${Math.PI * 2 * RADIUS}`)

const readout = computed(() => props.currentValueLabel ?? String(props.value))

const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'inline-flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '4px',
}))

const linearStyle = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '4px',
  width: modifierStyle.value.width ?? '100%',
  minWidth: modifierStyle.value.minWidth ?? 0,
}))
</script>

<template>
  <div
    v-if="gaugeStyle === 'circular'"
    class="gauge gauge--circular"
    :style="style"
    role="meter"
    :aria-valuenow="clampedValue"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-label="label"
    :aria-valuetext="valueText"
  >
    <div class="gauge-dial" :style="{ width: `${size}px`, height: `${size}px` }">
      <!-- rotated so the gap sits at the bottom and the sweep starts left -->
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g transform="rotate(135 50 50)">
          <circle
            class="gauge-track"
            cx="50" cy="50" :r="RADIUS"
            :stroke-dasharray="trackDash"
          />
          <circle
            class="gauge-fill"
            cx="50" cy="50" :r="RADIUS"
            :stroke="tintColor"
            :stroke-dasharray="valueDash"
          />
        </g>
      </svg>
      <span class="gauge-readout">{{ readout }}</span>
    </div>
    <span v-if="label" class="gauge-label">{{ label }}</span>
  </div>

  <div
    v-else
    class="gauge gauge--linear"
    :style="linearStyle"
    role="meter"
    :aria-valuenow="clampedValue"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-label="label"
    :aria-valuetext="valueText"
  >
    <div v-if="label || currentValueLabel" class="gauge-linear-head">
      <span v-if="label" class="gauge-label">{{ label }}</span>
      <span v-if="currentValueLabel" class="gauge-readout-inline">{{ currentValueLabel }}</span>
    </div>
    <div class="gauge-bar">
      <div class="gauge-bar-fill" :style="{ width: `${percent}%`, backgroundColor: tintColor }" />
    </div>
    <div v-if="minimumValueLabel || maximumValueLabel" class="gauge-ends">
      <span>{{ minimumValueLabel }}</span>
      <span>{{ maximumValueLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.gauge-dial { position: relative; }
.gauge-dial svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.gauge-track,
.gauge-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
}
.gauge-track { stroke: var(--swift-fill); }
.gauge-fill { transition: stroke-dasharray var(--swift-transition); }

.gauge-readout {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  color: var(--swift-label);
}
.gauge-label {
  font-size: 13px;
  color: var(--swift-secondary-label);
}

.gauge-linear-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.gauge-readout-inline {
  font-size: 13px;
  font-weight: 600;
  color: var(--swift-label);
}
.gauge-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--swift-fill);
  overflow: hidden;
}
.gauge-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--swift-transition);
}
.gauge-ends {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--swift-tertiary-label);
}

@media (prefers-reduced-motion: reduce) {
  .gauge-fill, .gauge-bar-fill { transition-duration: 0.01ms; }
}
</style>
