<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const modifierStyle = useModifiers(props)
const style = computed(() => modifierStyle.value)

const canDecrement = computed(() => props.modelValue > props.min)
const canIncrement = computed(() => props.modelValue < props.max)

function decrement() {
  if (canDecrement.value && !props.disabled) {
    emit('update:modelValue', Math.max(props.min, props.modelValue - props.step))
  }
}

function increment() {
  if (canIncrement.value && !props.disabled) {
    emit('update:modelValue', Math.min(props.max, props.modelValue + props.step))
  }
}
</script>

<template>
  <div class="stepper" :style="style" role="group" :aria-label="label ?? 'Stepper'">
    <button
      type="button"
      :disabled="!canDecrement || disabled"
      :aria-label="`Decrease${label ? ' ' + label : ''}`"
      @click="decrement"
    >−</button>
    <span class="value" aria-live="polite">{{ modelValue }}</span>
    <button
      type="button"
      :disabled="!canIncrement || disabled"
      :aria-label="`Increase${label ? ' ' + label : ''}`"
      @click="increment"
    >+</button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--swift-separator);
  border-radius: 8px;
  overflow: hidden;
}
.stepper button {
  font-family: inherit;
  font-size: 20px;
  font-weight: 300;
  width: 40px;
  height: 36px;
  border: none;
  background: var(--swift-secondary-background);
  color: var(--swift-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--swift-transition);
}
.stepper button:disabled { opacity: 0.3; cursor: not-allowed; }
.stepper button:not(:disabled):hover { background: var(--swift-fill); }
.stepper button:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.value {
  min-width: 44px;
  text-align: center;
  font-size: 17px;
  padding: 0 4px;
  color: var(--swift-label);
  border-left: 1px solid var(--swift-separator);
  border-right: 1px solid var(--swift-separator);
}
</style>
