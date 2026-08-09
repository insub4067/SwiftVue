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
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'


const props = withDefaults(defineProps<PickerProps>(), {
  pickerStyle: 'automatic',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()
const modifierStyle = useModifiers(props)

const isSegmented = computed(() => props.pickerStyle === 'segmented')

const selectStyle = computed(() => ({
  ...modifierStyle.value,
  fontFamily: 'inherit',
  fontSize: '17px',
  color: 'var(--swift-label)',
  backgroundColor: 'var(--swift-secondary-background)',
  border: '1px solid var(--swift-separator)',
  borderRadius: '8px',
  padding: '10px 12px',
  outline: 'none',
  width: modifierStyle.value.width ?? '100%',
  cursor: 'pointer',
}))

const segmentedStyle = computed(() => ({
  ...modifierStyle.value,
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
  <div v-if="isSegmented" :style="segmentedStyle">
    <button
      type="button"
      v-for="opt in options"
      :key="opt.value"
      :class="['segment', { active: modelValue === opt.value }]"
      :disabled="disabled"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
  <select v-else :value="modelValue" :style="selectStyle" :disabled="disabled" @change="onChange">
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<style scoped>
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
  transition: all var(--swift-transition);
}
.segment.active {
  background: var(--swift-secondary-grouped-background);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.segment:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
