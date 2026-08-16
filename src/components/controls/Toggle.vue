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

const trackStyle = computed(() => composeStyle(
  modifierStyle.value,
  {
    width: '51px',
    height: '31px',
    borderRadius: '15.5px',
    backgroundColor: props.modelValue ? props.tint : 'var(--swift-fill)',
    transition: 'background-color var(--swift-transition)',
    flexShrink: 0,
  },
  {
    position: 'relative' as const,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    // Dimming says "you cannot use this". An opacity modifier may set the
    // look of an enabled switch, but it may not hide that one is disabled.
    ...(props.disabled ? { opacity: 0.5 } : {}),
  },
))

// The knob rests at the leading edge and is *moved* by a transform. Sliding it
// with `inset-inline-start` looked right in a static screenshot and jumped in
// motion: a transition names one property, and no browser animates the logical
// property when the transition says `left`. A transform animates everywhere,
// and the mirroring for right-to-left is one CSS rule below.
const thumbStyle = computed(() => ({
  width: '27px',
  height: '27px',
  borderRadius: '50%',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  position: 'absolute' as const,
  top: '2px',
  insetInlineStart: '2px',
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
    <div
      class="swift-toggle-knob"
      :class="{ 'swift-toggle-knob--on': modelValue }"
      :style="thumbStyle"
    />
  </div>
</template>

<style scoped>
.swift-toggle-knob {
  transition: transform var(--swift-transition);
}

/* 51 wide, 27 across, 2 of padding on each side — the travel is what is left. */
.swift-toggle-knob--on {
  transform: translateX(20px);
}

[dir='rtl'] .swift-toggle-knob--on {
  transform: translateX(-20px);
}

@media (prefers-reduced-motion: reduce) {
  .swift-toggle-knob {
    transition-duration: 0.01ms;
  }
}
</style>
