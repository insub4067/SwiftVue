<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { useFocusBinding, type FocusStateProps } from '../../composables/useFocusState'

interface Props extends ModifierProps, FocusStateProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { modelValue: '' })
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:focused': [value: unknown]
  submit: []
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const { onFocus, onBlur, focus, blur } = useFocusBinding(props, emit, inputEl)
defineExpose({ focus, blur })

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
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
    ref="inputEl"
    type="password"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="style"
    @input="onInput"
    @keydown="onKeydown"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<style scoped>
input:focus { border-color: var(--swift-primary) !important; }
input::placeholder { color: var(--swift-tertiary-label); }
input:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
