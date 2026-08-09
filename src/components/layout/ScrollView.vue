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
const style = computed(() => ({
  ...modifierStyle.value,
  overflowX: (props.axes === 'horizontal' || props.axes === 'both' ? 'auto' : 'hidden') as any,
  overflowY: (props.axes === 'vertical' || props.axes === 'both' ? 'auto' : 'hidden') as any,
  flex: '1 1 0%',
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
