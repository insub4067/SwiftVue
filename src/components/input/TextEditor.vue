<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'
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
}>()

const textareaEl = ref<HTMLTextAreaElement | null>(null)
const { onFocus, onBlur, focus, blur } = useFocusBinding(props, emit, textareaEl)
defineExpose({ focus, blur })

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
  minHeight: modifierStyle.value.minHeight ?? '120px',
  resize: 'vertical' as const,
  transition: 'border-color var(--swift-transition)',
}))

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    ref="textareaEl"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :style="style"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<style scoped>
textarea:focus { border-color: var(--swift-primary) !important; }
textarea::placeholder { color: var(--swift-tertiary-label); }
textarea:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
