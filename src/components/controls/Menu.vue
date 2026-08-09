<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface MenuAction {
  label: string
  /** returned by @select so the handler can tell entries apart */
  id?: string | number
  systemImage?: string
  role?: 'destructive'
  disabled?: boolean
}

export interface MenuProps extends ModifierProps {
  label?: string
  actions?: MenuAction[]
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<MenuProps>(), { actions: () => [] })
const emit = defineEmits<{ select: [action: MenuAction] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuId = `swift-menu-${useId()}`

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(
  modifierStyle.value,
  {},
  // The popup is positioned against this box; a static one would send it to
  // the nearest positioned ancestor instead.
  { position: 'relative' as const, display: 'inline-block' as const },
))

function items() {
  return [...(menuEl.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])]
}

function toggle() {
  open.value = !open.value
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) root.value?.querySelector<HTMLElement>('button')?.focus()
}

function choose(action: MenuAction) {
  if (action.disabled) return
  emit('select', action)
  close()
}

// Roving focus through the open menu, Escape to dismiss — the keyboard
// contract a native menu has.
function onMenuKeydown(e: KeyboardEvent) {
  // Escape first: a menu with no enabled items must still be dismissable.
  if (e.key === 'Escape') { e.preventDefault(); close(); return }

  const focusable = items()
  if (!focusable.length) {
    if (e.key === 'Tab') close(false)
    return
  }
  const index = focusable.indexOf(document.activeElement as HTMLElement)

  if (e.key === 'ArrowDown') { e.preventDefault(); focusable[(index + 1) % focusable.length].focus() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); focusable[(index - 1 + focusable.length) % focusable.length].focus() }
  else if (e.key === 'Home') { e.preventDefault(); focusable[0].focus() }
  else if (e.key === 'End') { e.preventDefault(); focusable[focusable.length - 1].focus() }
  else if (e.key === 'Tab') close(false)
}

// Escape is handled here as well as on the menu: with no enabled item to
// focus, focus never leaves the trigger, so the menu never sees the key.
function onTriggerKeydown(e: KeyboardEvent) {
  if (open.value && e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown' && !open.value) {
    e.preventDefault()
    open.value = true
  }
}

function onPointerDownOutside(e: PointerEvent) {
  if (open.value && !root.value?.contains(e.target as Node)) close(false)
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.addEventListener('pointerdown', onPointerDownOutside)
    await nextTick()
    // With nothing enabled to focus, focus the menu itself — otherwise the
    // keys that dismiss it land on whatever held focus before.
    const first = items()[0]
    if (first) first.focus()
    else menuEl.value?.focus()
  } else {
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})
</script>

<template>
  <div ref="root" :style="style">
    <button
      type="button"
      class="menu-trigger"
      :aria-haspopup="true"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <slot name="label">{{ label }}</slot>
      <span class="menu-chevron" aria-hidden="true">⌄</span>
    </button>

    <div
      v-if="open"
      :id="menuId"
      ref="menuEl"
      class="menu-list"
      role="menu"
      tabindex="-1"
      :aria-label="label"
      @keydown="onMenuKeydown"
    >
      <slot>
        <button
          v-for="action in actions"
          :key="action.id ?? action.label"
          type="button"
          role="menuitem"
          class="menu-item"
          :class="{ destructive: action.role === 'destructive' }"
          :disabled="action.disabled"
          @click="choose(action)"
        >
          <span v-if="action.systemImage" class="menu-item-icon" aria-hidden="true">{{ action.systemImage }}</span>
          <span>{{ action.label }}</span>
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 17px;
  color: var(--swift-primary);
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
}
.menu-trigger:focus-visible,
.menu-item:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.menu-chevron { font-size: 13px; }

.menu-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  min-width: 200px;
  padding: 5px;
  border-radius: 13px;
  background: var(--swift-secondary-background);
  border: 1px solid var(--swift-separator);
  box-shadow: 0 10px 30px rgb(0 0 0 / 18%);
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: none;
  font-family: inherit;
  font-size: 17px;
  color: var(--swift-label);
  text-align: left;
  cursor: pointer;
}
.menu-item:hover:not(:disabled) { background: var(--swift-fill); }
.menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.menu-item.destructive { color: var(--swift-red); }
.menu-item-icon { font-size: 16px; }
</style>
