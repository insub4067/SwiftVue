<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  buttonStyle?: 'automatic' | 'bordered' | 'borderedProminent' | 'borderless' | 'plain'
  role?: 'destructive' | 'cancel'
  disabled?: boolean
  fullWidth?: boolean
  /**
   * A `<button>` with no type submits the enclosing form, so this defaults
   * to `button`. Opt into `submit` where that is what you actually want.
   */
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  buttonStyle: 'automatic',
  type: 'button',
})

const emit = defineEmits<{ tap: [] }>()

const modifierStyle = useModifiers(props)

const baseColor = computed(() => {
  if (props.role === 'destructive') return 'var(--swift-red)'
  return 'var(--swift-primary)'
})

const style = computed(() => {
  const s: any = {
    ...modifierStyle.value,
    fontFamily: 'inherit',
    fontSize: '17px',
    lineHeight: '22px',
    fontWeight: '400',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all var(--swift-transition)',
    width: props.fullWidth ? '100%' : modifierStyle.value.width,
  }

  switch (props.buttonStyle) {
    case 'borderedProminent':
      s.backgroundColor = baseColor.value
      s.color = '#FFFFFF'
      s.padding = modifierStyle.value.padding ?? '10px 20px'
      s.borderRadius = modifierStyle.value.borderRadius ?? '10px'
      s.fontWeight = '600'
      break
    case 'bordered':
      s.backgroundColor = 'transparent'
      s.color = baseColor.value
      s.padding = modifierStyle.value.padding ?? '10px 20px'
      s.borderRadius = modifierStyle.value.borderRadius ?? '10px'
      s.border = `1px solid ${baseColor.value}`
      break
    case 'borderless':
    case 'plain':
      s.backgroundColor = 'transparent'
      s.color = baseColor.value
      s.padding = modifierStyle.value.padding ?? '6px 2px'
      break
    default:
      s.backgroundColor = 'var(--swift-fill)'
      s.color = baseColor.value
      s.padding = modifierStyle.value.padding ?? '10px 20px'
      s.borderRadius = modifierStyle.value.borderRadius ?? '10px'
  }

  if (props.disabled) s.opacity = 0.4

  return s
})
</script>

<template>
  <button :type="type" :style="style" :disabled="disabled" @click="emit('tap')">
    <slot />
  </button>
</template>

<style scoped>
button:not(:disabled):hover { filter: brightness(0.92); }
button:not(:disabled):active { transform: scale(0.97); }
button:focus-visible { outline: 2px solid var(--swift-primary); outline-offset: 2px; }
</style>
