<script lang="ts">
export interface PickerOption {
  value: string | number
  label: string
}

export interface PickerProps extends ModifierProps {
  modelValue?: string | number
  options: PickerOption[]
  pickerStyle?: 'automatic' | 'menu' | 'segmented'
  disabled?: boolean
  /**
   * What the control is called, announced to a screen reader — SwiftUI's
   * first argument to `Picker(_:selection:)`. It is not drawn: a Form row
   * already shows the title beside the control, and rendering it twice
   * would read it twice.
   */
  label?: string
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { warnIfUnnamed } from '../../utils/warn'


const props = withDefaults(defineProps<PickerProps>(), {
  pickerStyle: 'automatic',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const modifierStyle = useModifiers(props)

warnIfUnnamed('Picker', props.label, useAttrs())

// A segmented control is a set of choices of which exactly one is taken,
// and that is a radio group. Rendered as plain buttons the chosen segment
// was styled and nothing more, so the one fact the control exists to
// convey was the one fact a screen reader could not reach.
//
// The template keeps a single root — a comment above it would make the
// component a fragment, and every modifier would silently stop applying.
const isSegmented = computed(() => props.pickerStyle === 'segmented')

const selectStyle = computed(() => composeStyle(modifierStyle.value, {
  fontFamily: 'inherit',
  fontSize: '17px',
  color: 'var(--swift-label)',
  backgroundColor: 'var(--swift-secondary-background)',
  border: '1px solid var(--swift-separator)',
  borderRadius: '8px',
  padding: '10px 12px',
  // No inline outline — the scoped `select:focus-visible` ring handles it.
  // 44px touch-target floor, border-box so it includes the padding.
  boxSizing: 'border-box',
  minHeight: '44px',
  width: modifierStyle.value.width ?? '100%',
  cursor: 'pointer',
}))

// Which segment is chosen, so the sliding pill can be placed by index.
const segmentedIndex = computed(() =>
  Math.max(props.options.findIndex(o => o.value === props.modelValue), 0),
)

const segmentedStyle = computed(() => composeStyle(modifierStyle.value, {
  // A segmented control fills the width it is given and splits it evenly, the
  // way `.pickerStyle(.segmented)` does on iOS — not a compact pill that hugs
  // its labels and strands empty track beside them. A width modifier still
  // overrides, for the rare case a caller wants it narrow.
  position: 'relative',
  display: 'flex',
  width: modifierStyle.value.width ?? '100%',
  // A light, solid track (not the translucent fill) so the white pill reads as
  // a clear raised selection rather than sitting on a heavy grey slab.
  backgroundColor: 'var(--swift-secondary-background)',
  border: '1px solid var(--swift-separator)',
  borderRadius: '12px',
  padding: '3px',
  boxSizing: 'border-box',
}))

// The sliding pill's size and position are computed here, not in the
// stylesheet: a `translateX` percentage of the pill's own width lands it on the
// active segment, and setting it inline keeps a CSS minifier from rewriting the
// transform into a form the browser animates differently.
const segmentedPillStyle = computed(() => {
  const count = Math.max(props.options.length, 1)
  return {
    width: `calc((100% - 6px) / ${count})`,
    transform: `translateX(${segmentedIndex.value * 100}%)`,
  }
})

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const original = props.options.find(o => String(o.value) === val)
  emit('update:modelValue', original ? original.value : val)
}
</script>

<template>
  <div v-if="isSegmented" role="radiogroup" :aria-label="label" :style="segmentedStyle">
    <!-- The chosen pill, drawn once and slid under the active label, so the
         selection glides between segments instead of blinking on and off. -->
    <span class="segment-pill" :style="segmentedPillStyle" aria-hidden="true" />
    <button
      type="button"
      v-for="opt in options"
      :key="opt.value"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :class="['segment', { active: modelValue === opt.value }]"
      :disabled="disabled"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
  <select
    v-else
    :value="modelValue"
    :aria-label="label"
    :style="selectStyle"
    :disabled="disabled"
    @change="onChange"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<style scoped>
select:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
select:disabled { opacity: 0.5; cursor: not-allowed; }
/* The single sliding pill sits behind the labels and moves by segment index.
   Its width is one share of the padded track; translateX(index * 100%) steps
   it one segment at a time. */
.segment-pill {
  /* Width and X-offset come from an inline style (segmentedPillStyle); the
     constant parts live here. Sliding by transform keeps it off the layout. */
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  border-radius: 9px;
  background: var(--swift-secondary-grouped-background);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: transform var(--swift-transition);
  pointer-events: none;
}
.segment {
  /* Each segment takes an equal share of the track, above the sliding pill. */
  position: relative;
  z-index: 1;
  flex: 1;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 10px;
  /* 44px touch-target floor on each segment, matching the other controls;
     border-box so the padding counts inward instead of adding on top. */
  box-sizing: border-box;
  min-height: 44px;
  min-width: 44px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--swift-secondary);
  cursor: pointer;
  transition: color var(--swift-transition);
}
.segment.active {
  color: var(--swift-label);
}
@media (prefers-reduced-motion: reduce) {
  .segment-pill { transition-duration: 0.01ms; }
  .segment { transition-duration: 0.01ms; }
}
.segment:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
.segment:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
