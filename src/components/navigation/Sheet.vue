<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  isPresented: boolean
  detents?: ('medium' | 'large')[]
}

const props = withDefaults(defineProps<Props>(), {
  detents: () => ['large'],
})

const emit = defineEmits<{ 'update:isPresented': [value: boolean]; dismiss: [] }>()
const modifierStyle = useModifiers(props)
const containerStyle = computed(() => ({ ...modifierStyle.value, maxHeight: sheetHeight.value }))

const sheetHeight = computed(() => {
  if (props.detents.includes('large')) return '92%'
  return '50%'
})

function dismiss() {
  emit('update:isPresented', false)
  emit('dismiss')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') dismiss()
}

watch(() => props.isPresented, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="isPresented" class="sheet-overlay" @click.self="dismiss">
        <div class="sheet-container" :style="containerStyle">
          <div class="sheet-handle" />
          <div class="sheet-content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}
.sheet-container {
  width: 100%;
  max-width: 640px;
  background: var(--swift-secondary-background);
  border-radius: 12px 12px 0 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.sheet-handle {
  width: 36px;
  height: 5px;
  border-radius: 2.5px;
  background: var(--swift-fill);
  margin: 8px auto;
  flex-shrink: 0;
}
.sheet-content {
  flex: 1;
  padding: 8px 16px 16px;
  overflow-y: auto;
}

.sheet-enter-active, .sheet-leave-active {
  transition: opacity 0.3s ease;
}
.sheet-enter-active .sheet-container, .sheet-leave-active .sheet-container {
  transition: transform 0.3s ease;
}
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-container, .sheet-leave-to .sheet-container {
  transform: translateY(100%);
}
</style>
