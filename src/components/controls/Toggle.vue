<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  modelValue?: boolean
  tint?: string
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  tint: 'var(--swift-green)',
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const modifierStyle = useModifiers(props)

const trackStyle = computed(() => composeStyle(modifierStyle.value, {
  width: '51px',
  height: '31px',
  borderRadius: '15.5px',
  backgroundColor: props.modelValue ? props.tint : 'var(--swift-fill)',
  position: 'relative' as const,
  cursor: props.disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color var(--swift-transition)',
  opacity: props.disabled ? 0.5 : 1,
  flexShrink: 0,
}))

const thumbStyle = computed(() => ({
  width: '27px',
  height: '27px',
  borderRadius: '50%',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  position: 'absolute' as const,
  top: '2px',
  left: props.modelValue ? '22px' : '2px',
  transition: 'left var(--swift-transition)',
  pointerEvents: 'none' as const,
}))

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    toggle()
  }
}
</script>

<template>
  <div
    :style="trackStyle"
    role="switch"
    :tabindex="disabled ? -1 : 0"
    :aria-checked="modelValue"
    :aria-disabled="disabled || undefined"
    :aria-label="label"
    @click="toggle"
    @keydown="onKeydown"
  >
    <div :style="thumbStyle" />
  </div>
</template>
