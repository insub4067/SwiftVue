<script setup lang="ts">
import { computed } from 'vue'

interface AlertAction {
  label: string
  role?: 'cancel' | 'destructive'
}

interface Props {
  isPresented: boolean
  title: string
  message?: string
  actions?: AlertAction[]
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [{ label: 'OK' }],
})

const emit = defineEmits<{
  'update:isPresented': [value: boolean]
  action: [label: string]
}>()

function handleAction(action: AlertAction) {
  emit('action', action.label)
  emit('update:isPresented', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="isPresented" class="alert-overlay">
        <div class="alert-box">
          <div class="alert-body">
            <h3 class="alert-title">{{ title }}</h3>
            <p v-if="message" class="alert-message">{{ message }}</p>
          </div>
          <div class="alert-actions" :class="{ stacked: actions.length > 2 }">
            <button
              v-for="action in actions"
              :key="action.label"
              :class="['alert-btn', action.role]"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}
.alert-box {
  background: var(--swift-secondary-background);
  border-radius: 14px;
  width: 270px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.alert-body {
  padding: 20px 16px 12px;
  text-align: center;
}
.alert-title {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--swift-label);
}
.alert-message {
  font-size: 13px;
  color: var(--swift-secondary-label);
  margin: 0;
  line-height: 1.4;
}
.alert-actions {
  display: flex;
  border-top: 1px solid var(--swift-separator);
}
.alert-actions.stacked { flex-direction: column; }
.alert-btn {
  flex: 1;
  padding: 11px 8px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 17px;
  color: var(--swift-primary);
  cursor: pointer;
  transition: background var(--swift-transition);
}
.alert-btn + .alert-btn {
  border-left: 1px solid var(--swift-separator);
}
.stacked .alert-btn + .alert-btn {
  border-left: none;
  border-top: 1px solid var(--swift-separator);
}
.alert-btn:hover { background: var(--swift-fill); }
.alert-btn.cancel { font-weight: 600; }
.alert-btn.destructive { color: var(--swift-red); }

.alert-enter-active, .alert-leave-active { transition: opacity 0.2s ease; }
.alert-enter-active .alert-box { transition: transform 0.2s ease; }
.alert-leave-active .alert-box { transition: transform 0.15s ease; }
.alert-enter-from, .alert-leave-to { opacity: 0; }
.alert-enter-from .alert-box { transform: scale(1.05); }
.alert-leave-to .alert-box { transform: scale(0.95); }
</style>
