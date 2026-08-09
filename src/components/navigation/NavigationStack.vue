<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  title?: string
  displayMode?: 'large' | 'inline'
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'large',
})

const modifierStyle = useModifiers(props)
const navStack = ref<string[]>([])
provide('swiftvue-nav-stack', navStack)

const style = computed(() => ({
  ...modifierStyle.value,
  display: 'flex',
  flexDirection: 'column' as const,
  height: modifierStyle.value.height ?? '100%',
  backgroundColor: 'var(--swift-grouped-background)',
}))
</script>

<template>
  <div :style="style">
    <header v-if="title" :class="['nav-header', `nav-header--${displayMode}`]">
      <h1>{{ title }}</h1>
    </header>
    <div class="nav-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.nav-header { padding: 0 16px; }
.nav-header--large h1 {
  font-size: 34px;
  font-weight: 700;
  line-height: 41px;
  margin: 16px 0 8px;
  color: var(--swift-label);
}
.nav-header--inline {
  border-bottom: 1px solid var(--swift-separator);
  padding: 12px 16px;
}
.nav-header--inline h1 {
  font-size: 17px;
  font-weight: 600;
  line-height: 22px;
  margin: 0;
  text-align: center;
  color: var(--swift-label);
}
.nav-content { flex: 1; overflow-y: auto; }
</style>
