<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { modelValue: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [] }>()

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  fontFamily: 'inherit',
  fontSize: '17px',
  lineHeight: '22px',
  color: 'var(--swift-label)',
  backgroundColor: 'var(--swift-secondary-background)',
  border: '1px solid var(--swift-separator)',
  borderRadius: '8px',
  padding: modifierStyle.value.padding ?? '10px 12px',
  outline: 'none',
  width: modifierStyle.value.width ?? '100%',
  transition: 'border-color var(--swift-transition)',
}))

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') emit('submit')
}
</script>

<template>
  <input
    type="password"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="style"
    @input="onInput"
    @keydown="onKeydown"
  />
</template>

<style scoped>
input:focus { border-color: var(--swift-primary) !important; }
input::placeholder { color: var(--swift-tertiary-label); }
input:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
