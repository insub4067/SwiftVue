<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { warnIfUnnamed } from '../../utils/warn'
import { useFocusBinding, type FocusStateProps } from '../../composables/useFocusState'
import { useSubmitAction } from '../../composables/useSubmit'

interface Props extends ModifierProps, FocusStateProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  /**
   * What the field is called, announced to a screen reader — SwiftUI's
   * first argument to `TextField(_:text:)`. A placeholder is not a
   * substitute: it disappears the moment anything is typed.
   */
  label?: string
  textFieldStyle?: 'plain' | 'roundedBorder'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  textFieldStyle: 'plain',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:focused': [value: unknown]
  submit: []
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const { onFocus, onBlur, focus, blur } = useFocusBinding(props, emit, inputEl)
defineExpose({ focus, blur })

// A placeholder is a weak name — it vanishes as soon as the field has
// content — but it is a name, and warning about every one of them
// would be an opinion rather than a defect report.
warnIfUnnamed('TextField', props.label ?? props.placeholder, useAttrs())

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  fontFamily: 'inherit',
  fontSize: '17px',
  lineHeight: '22px',
  color: 'var(--swift-label)',
  backgroundColor: props.textFieldStyle === 'roundedBorder' ? 'var(--swift-secondary-background)' : 'transparent',
  border: props.textFieldStyle === 'roundedBorder' ? '1px solid var(--swift-separator)' : 'none',
  borderBottom: props.textFieldStyle === 'plain' ? '1px solid var(--swift-separator)' : undefined,
  borderRadius: props.textFieldStyle === 'roundedBorder' ? '8px' : '0',
  padding: modifierStyle.value.padding ?? (props.textFieldStyle === 'roundedBorder' ? '10px 12px' : '8px 0'),
  // No inline `outline: none` — it would beat the scoped `:focus-visible`
  // ring below. The 44px minimum touch target is the library's to keep, not
  // the app's; border-box so the min includes the padding.
  boxSizing: 'border-box',
  minHeight: '44px',
  width: modifierStyle.value.width ?? '100%',
  transition: 'border-color var(--swift-transition)',
}))

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// Both channels fire: the field's own event for a caller wiring this one
// field, and the inherited action for an onSubmit covering the screen.
const submitAction = useSubmitAction()

function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  emit('submit')
  submitAction?.()
}
</script>

<template>
  <input
    ref="inputEl"
    type="text"
    :value="modelValue"
    :placeholder="placeholder"
    :aria-label="label"
    :disabled="disabled"
    :style="style"
    @input="onInput"
    @keydown="onKeydown"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<style scoped>
input:focus {
  border-color: var(--swift-primary) !important;
}
/* The keyboard focus ring. A text field is treated as always focus-visible
   because it takes typing, so this shows on click too — which is right: a
   focused field should look focused. */
input:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
}
input::placeholder {
  color: var(--swift-tertiary-label);
}
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
