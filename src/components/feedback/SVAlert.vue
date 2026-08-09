<script lang="ts">
export interface AlertAction {
  label: string
  role?: 'cancel' | 'destructive'
}

export interface AlertProps {
  isPresented: boolean
  title: string
  message?: string
  actions?: AlertAction[]
}
</script>

<script setup lang="ts">
import { watch, nextTick, ref } from 'vue'


const props = withDefaults(defineProps<AlertProps>(), {
  actions: () => [{ label: 'OK' }],
})

const emit = defineEmits<{
  'update:isPresented': [value: boolean]
  action: [label: string]
}>()

const alertBox = ref<HTMLElement | null>(null)
const overlay = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function handleAction(action: AlertAction) {
  emit('action', action.label)
  emit('update:isPresented', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    // An alert with no actions still has to close. Reaching for the last of
    // an empty list read `.label` off undefined and took the app down.
    const cancel = props.actions.find(a => a.role === 'cancel')
    const fallback = props.actions[props.actions.length - 1]
    const action = cancel ?? fallback
    if (action) handleAction(action)
    else emit('update:isPresented', false)
    return
  }
  if (e.key === 'Tab' && alertBox.value) {
    const focusable = alertBox.value.querySelectorAll<HTMLElement>('button, [tabindex]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

// immediate: an alert mounted already open must still take focus.
watch(() => props.isPresented, async (val) => {
  if (val) {
    previouslyFocused = document.activeElement as HTMLElement
    await nextTick()
    // With no button to take focus, focus the dialog itself — otherwise
    // Escape lands on whatever held focus before and never reaches here.
    const firstBtn = alertBox.value?.querySelector<HTMLElement>('button')
    if (firstBtn) firstBtn.focus()
    else overlay.value?.focus()
  } else {
    previouslyFocused?.focus()
    previouslyFocused = null
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="alert">
      <div
        v-if="isPresented"
        ref="overlay"
        class="alert-overlay"
        tabindex="-1"
        role="alertdialog"
        aria-modal="true"
        :aria-label="title"
        @keydown="onKeydown"
      >
        <div ref="alertBox" class="alert-box">
          <div class="alert-body">
            <h3 id="alert-title" class="alert-title">{{ title }}</h3>
            <p v-if="message" id="alert-message" class="alert-message">{{ message }}</p>
          </div>
          <div class="alert-actions" :class="{ stacked: actions.length > 2 }">
            <button
              type="button"
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
.alert-btn:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.alert-btn + .alert-btn {
  border-inline-start: 1px solid var(--swift-separator);
}
.stacked .alert-btn + .alert-btn {
  border-inline-start: none;
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
