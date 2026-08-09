<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface DatePickerProps extends ModifierProps {
  /** ISO string bound with v-model: `2026-08-09`, `14:30`, or `2026-08-09T14:30` */
  modelValue?: string
  /** SwiftUI's displayedComponents */
  displayedComponents?: 'date' | 'hourAndMinute' | 'dateAndTime'
  min?: string
  max?: string
  disabled?: boolean
  label?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<DatePickerProps>(), {
  modelValue: '',
  displayedComponents: 'date',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inputType = computed(() => ({
  date: 'date',
  hourAndMinute: 'time',
  dateAndTime: 'datetime-local',
}[props.displayedComponents]))

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  fontFamily: 'inherit',
  fontSize: '17px',
  lineHeight: '22px',
  color: 'var(--swift-label)',
  backgroundColor: 'var(--swift-fill)',
  border: 'none',
  borderRadius: '8px',
  padding: modifierStyle.value.padding ?? '7px 11px',
  outline: 'none',
}))

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :type="inputType"
    :value="modelValue"
    :min="min"
    :max="max"
    :disabled="disabled"
    :aria-label="label"
    :style="style"
    @input="onInput"
  >
</template>

<style scoped>
input:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
input:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
