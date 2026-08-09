<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  textFieldStyle?: 'plain' | 'roundedBorder'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  textFieldStyle: 'plain',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const modifierStyle = useModifiers(props)
const style = computed(() => ({
  ...modifierStyle.value,
  fontFamily: 'inherit',
  fontSize: '17px',
  lineHeight: '22px',
  color: 'var(--swift-label)',
  backgroundColor: props.textFieldStyle === 'roundedBorder' ? 'var(--swift-secondary-background)' : 'transparent',
  border: props.textFieldStyle === 'roundedBorder' ? '1px solid var(--swift-separator)' : 'none',
  borderBottom: props.textFieldStyle === 'plain' ? '1px solid var(--swift-separator)' : undefined,
  borderRadius: props.textFieldStyle === 'roundedBorder' ? '8px' : '0',
  padding: modifierStyle.value.padding ?? (props.textFieldStyle === 'roundedBorder' ? '10px 12px' : '8px 0'),
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
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="style"
    @input="onInput"
    @keydown="onKeydown"
  />
</template>

<style scoped>
input:focus {
  border-color: var(--swift-primary) !important;
}
input::placeholder {
  color: var(--swift-tertiary-label);
}
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
