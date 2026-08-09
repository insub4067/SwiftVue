<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface FormProps extends ModifierProps {
  /** grouped-list spacing between Sections, as SwiftUI's Form lays them out */
  spacing?: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<FormProps>(), { spacing: 24 })
const emit = defineEmits<{ submit: [event: SubmitEvent] }>()

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: `${props.spacing}px`,
  width: modifierStyle.value.width ?? '100%',
  minWidth: modifierStyle.value.minWidth ?? 0,
}))

// A real <form> so Enter-to-submit and browser validation work. Every button
// in the library defaults to type="button", so only an explicit
// `type="submit"` reaches this.
function onSubmit(event: Event) {
  event.preventDefault()
  // Hand the original event on: submitter, FormData and modifier keys all
  // live on it, and nothing else can recover them afterwards.
  emit('submit', event as SubmitEvent)
}
</script>

<template>
  <form :style="style" @submit="onSubmit">
    <slot />
  </form>
</template>
