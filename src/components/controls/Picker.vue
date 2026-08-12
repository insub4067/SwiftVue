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

const segmentedStyle = computed(() => composeStyle(modifierStyle.value, {
  display: 'inline-flex',
  backgroundColor: 'var(--swift-fill)',
  borderRadius: '8px',
  padding: '2px',
  gap: '0px',
}))

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  const original = props.options.find(o => String(o.value) === val)
  emit('update:modelValue', original ? original.value : val)
}
</script>

<template>
  <div v-if="isSegmented" role="radiogroup" :aria-label="label" :style="segmentedStyle">
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
.segment {
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--swift-label);
  cursor: pointer;
  /* Only what changes when a segment is picked or hovered — not `all`, which
     would animate the layout of a re-flowed segment too. */
  transition: background var(--swift-transition), box-shadow var(--swift-transition), color var(--swift-transition);
}
.segment.active {
  background: var(--swift-secondary-grouped-background);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.segment:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
.segment:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
