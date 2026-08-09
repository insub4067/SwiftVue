<script setup lang="ts">
import { computed, watch, nextTick, ref, onUnmounted } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

interface Props extends ModifierProps {
  isPresented: boolean
  detents?: ('medium' | 'large')[]
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  detents: () => ['large'],
})

const emit = defineEmits<{ 'update:isPresented': [value: boolean]; dismiss: [] }>()
const modifierStyle = useModifiers(props)

const sheetEl = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const sheetHeight = computed(() => {
  if (props.detents.includes('large')) return '92%'
  return '50%'
})

const containerStyle = computed(() => composeStyle(modifierStyle.value, { maxHeight: sheetHeight.value }))

// `hidden` has to suppress the backdrop too. Hiding only the container would
// leave a dimmed, un-dismissable page behind it.
const visible = computed(() => props.isPresented && !props.hidden)

function dismiss() {
  emit('update:isPresented', false)
  emit('dismiss')
}

function onOverlayKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    dismiss()
    return
  }
  if (e.key === 'Tab' && sheetEl.value) {
    const focusable = sheetEl.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }
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

// Remember what the page had rather than assuming '' — another overlay may
// already own the scroll lock, and clearing it would let the page scroll
// behind it.
let restoreOverflow: string | null = null

function lockScroll() {
  if (restoreOverflow !== null) return
  restoreOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function unlockScroll() {
  if (restoreOverflow === null) return
  document.body.style.overflow = restoreOverflow
  restoreOverflow = null
}

// immediate: a sheet mounted already open must still trap focus and lock
// scrolling — otherwise the very first render skips both.
watch(visible, async (val) => {
  if (val) {
    previouslyFocused = document.activeElement as HTMLElement
    lockScroll()
    await nextTick()
    const firstFocusable = sheetEl.value?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  } else {
    unlockScroll()
    previouslyFocused?.focus()
    previouslyFocused = null
  }
}, { immediate: true })

onUnmounted(unlockScroll)
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="visible"
        class="sheet-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        @click.self="dismiss"
        @keydown="onOverlayKeydown"
      >
        <div ref="sheetEl" class="sheet-container" :style="containerStyle">
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
  color: var(--swift-label);
  box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.2);
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

@media (min-width: 768px) {
  .sheet-overlay { align-items: center; padding: 24px; }
  .sheet-container {
    width: min(100%, 560px);
    max-height: min(82vh, 720px) !important;
    border-radius: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .sheet-container,
  .sheet-leave-active .sheet-container {
    transition-duration: 0.01ms;
  }
}
</style>
