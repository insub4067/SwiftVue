<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  tint?: string
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  tint: 'var(--swift-primary)',
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
const modifierStyle = useModifiers(props)

const style = computed(() => ({
  ...modifierStyle.value,
  width: modifierStyle.value.width ?? '100%',
}))

function onInput(e: Event) {
  emit('update:modelValue', Number((e.target as HTMLInputElement).value))
}
</script>

<template>
  <input
    type="range"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :aria-label="label"
    :aria-valuetext="`${modelValue}`"
    :style="style"
    class="swift-slider"
    @input="onInput"
  />
</template>

<style scoped>
.swift-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--swift-fill);
  outline: none;
  cursor: pointer;
}
.swift-slider:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 4px;
}
.swift-slider:disabled { opacity: 0.5; cursor: not-allowed; }
.swift-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  cursor: grab;
}
.swift-slider::-webkit-slider-thumb:active { cursor: grabbing; }
.swift-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  border: none;
  cursor: grab;
}
</style>
