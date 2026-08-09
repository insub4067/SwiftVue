<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  axes?: 'vertical' | 'horizontal' | 'both'
  showsIndicators?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  axes: 'vertical',
  showsIndicators: true,
})

const modifierStyle = useModifiers(props)
const scrollsHorizontally = computed(() => props.axes === 'horizontal' || props.axes === 'both')

const style = computed(() => ({
  ...modifierStyle.value,
  overflowX: (scrollsHorizontally.value ? 'auto' : 'hidden') as any,
  overflowY: (props.axes === 'vertical' || props.axes === 'both' ? 'auto' : 'hidden') as any,
  flex: '1 1 0%',
  // A horizontal scroller must take its width from the parent. Left to size
  // itself it resolves to its content width, which both inflates ancestors
  // and leaves nothing to scroll.
  ...(scrollsHorizontally.value ? { width: modifierStyle.value.width ?? '100%' } : {}),
  minWidth: modifierStyle.value.minWidth ?? 0,
}))
</script>

<template>
  <div :style="style" :class="{ 'hide-scrollbar': !showsIndicators }">
    <slot />
  </div>
</template>

<style scoped>
.hide-scrollbar { scrollbar-width: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
</style>
