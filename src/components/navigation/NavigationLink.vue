<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  to?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ tap: [] }>()
const modifierStyle = useModifiers(props)

const style = computed(() => ({
  ...modifierStyle.value,
  display: 'flex',
  alignItems: 'center',
  padding: modifierStyle.value.padding ?? '11px 16px',
  cursor: 'pointer',
  transition: 'background var(--swift-transition)',
  textDecoration: 'none',
  color: 'inherit',
}))
</script>

<template>
  <router-link v-if="to" :to="to" :style="style" class="nav-link">
    <span class="nav-link-content"><slot /></span>
    <span class="nav-link-chevron">›</span>
  </router-link>
  <div v-else :style="style" class="nav-link" @click="emit('tap')">
    <span class="nav-link-content"><slot /></span>
    <span class="nav-link-chevron">›</span>
  </div>
</template>

<style scoped>
.nav-link:hover { background: var(--swift-fill); }
.nav-link-content { flex: 1; }
.nav-link-chevron {
  color: var(--swift-tertiary-label);
  font-size: 20px;
  font-weight: 300;
  margin-left: 8px;
}
</style>
