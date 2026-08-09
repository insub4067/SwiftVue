<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'
import type { MenuAction } from './Menu.vue'

export interface ContextMenuProps extends ModifierProps {
  actions?: MenuAction[]
  /** how long a touch must be held before the menu opens, in ms */
  longPressDelay?: number
  /** announced as the menu's name */
  label?: string
  disabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'

const props = withDefaults(defineProps<ContextMenuProps>(), {
  actions: () => [],
  longPressDelay: 500,
})
const emit = defineEmits<{ select: [action: MenuAction] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuId = `swift-context-menu-${useId()}`
// Where the menu opens: the pointer, as a native context menu does.
const at = ref({ x: 0, y: 0 })

const modifierStyle = useModifiers(props)
const style = computed(() => composeStyle(
  modifierStyle.value,
  {},
  // The menu is positioned against this box, at the pointer.
  { position: 'relative' as const, display: 'inline-block' as const },
))

const menuStyle = computed(() => ({ left: `${at.value.x}px`, top: `${at.value.y}px` }))

function items() {
  return [...(menuEl.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])]
}

function openAt(x: number, y: number) {
  if (props.disabled) return
  at.value = { x, y }
  open.value = true
}

function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) root.value?.focus()
}

function choose(action: MenuAction) {
  if (action.disabled) return
  emit('select', action)
  close()
}

function onContextMenu(e: MouseEvent) {
  if (props.disabled) return
  e.preventDefault() // ours replaces the browser's
  const box = root.value!.getBoundingClientRect()
  openAt(e.clientX - box.left, e.clientY - box.top)
}

// Touch has no right button, so iOS uses a long press. A press that moves is
// a scroll, not a menu — cancel on the first real movement.
let timer: ReturnType<typeof setTimeout> | null = null
let startedAt: { x: number; y: number } | null = null

function cancelPress() {
  if (timer) clearTimeout(timer)
  timer = null
  startedAt = null
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerup', cancelPress)
    document.removeEventListener('pointercancel', cancelPress)
  }
}

/**
 * A long press that opened the menu must not also activate what it was
 * pressing. The browser still fires a click when the finger lifts, and the
 * content underneath is often a button or a NavigationLink.
 */
function swallowNextClick(e: MouseEvent) {
  // menu items are inside the root too, and theirs must go through
  if (menuEl.value?.contains(e.target as Node)) return
  e.stopPropagation()
  e.preventDefault()
  stopSwallowing()
}

function stopSwallowing() {
  root.value?.removeEventListener('click', swallowNextClick, true)
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' || props.disabled) return
  const box = root.value!.getBoundingClientRect()
  const x = e.clientX - box.left
  const y = e.clientY - box.top
  startedAt = { x: e.clientX, y: e.clientY }

  // The finger can leave the target before it lifts, and then the element
  // never sees pointerup. The document always does.
  document.addEventListener('pointerup', cancelPress)
  document.addEventListener('pointercancel', cancelPress)

  timer = setTimeout(() => {
    timer = null
    // Capture phase, so it runs before the content's own handler.
    root.value?.addEventListener('click', swallowNextClick, true)
    openAt(x, y)
  }, props.longPressDelay)
}

function onPointerMove(e: PointerEvent) {
  if (!startedAt) return
  const moved = Math.hypot(e.clientX - startedAt.x, e.clientY - startedAt.y)
  if (moved > 10) cancelPress()
}

// The keyboard route in, so the menu is not pointer-only. Escape is handled
// here as well as on the menu: with no enabled item to focus there is nothing
// inside the menu to receive the key.
function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return
  if (open.value && e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
    e.preventDefault()
    openAt(8, 8)
  }
}

function onMenuKeydown(e: KeyboardEvent) {
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

function onPointerDownOutside(e: PointerEvent) {
  if (open.value && !menuEl.value?.contains(e.target as Node)) close(false)
}

watch(open, async (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    cancelPress()
    document.addEventListener('pointerdown', onPointerDownOutside)
    await nextTick()
    // With nothing enabled to focus, focus the menu itself — otherwise the
    // keys that dismiss it land on whatever held focus before.
    const first = items()[0]
    if (first) first.focus()
    else menuEl.value?.focus()
  } else {
    stopSwallowing()
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})

onBeforeUnmount(() => {
  cancelPress()
  stopSwallowing()
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onPointerDownOutside)
  }
})

defineExpose({ close })
</script>

<template>
  <div
    ref="root"
    class="context-menu-target"
    :style="style"
    :tabindex="disabled ? undefined : 0"
    :aria-haspopup="disabled ? undefined : true"
    :aria-expanded="disabled ? undefined : open"
    :aria-controls="open ? menuId : undefined"
    @contextmenu="onContextMenu"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="cancelPress"
    @pointercancel="cancelPress"
    @keydown="onKeydown"
  >
    <slot />

    <div
      v-if="open"
      :id="menuId"
      ref="menuEl"
      class="context-menu"
      role="menu"
      tabindex="-1"
      :aria-label="label"
      :style="menuStyle"
      @keydown="onMenuKeydown"
    >
      <slot name="actions">
        <button
          v-for="action in actions"
          :key="action.id ?? action.label"
          type="button"
          role="menuitem"
          class="context-menu-item"
          :class="{ destructive: action.role === 'destructive' }"
          :disabled="action.disabled"
          @click="choose(action)"
        >
          <span>{{ action.label }}</span>
          <span v-if="action.systemImage" class="context-menu-icon" aria-hidden="true">{{ action.systemImage }}</span>
        </button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.context-menu-target {
  /* a long press should open the menu, not select the text under it */
  -webkit-touch-callout: none;
  user-select: none;
}
.context-menu-target:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
  border-radius: 8px;
}

.context-menu {
  position: absolute;
  z-index: 60;
  min-width: 180px;
  max-width: 260px;
  padding: 5px;
  border-radius: 13px;
  background: var(--swift-secondary-background);
  border: 1px solid var(--swift-separator);
  box-shadow: 0 12px 36px rgb(0 0 0 / 22%);
}
.context-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 11px;
  border: none;
  border-radius: 9px;
  background: none;
  font-family: inherit;
  font-size: 17px;
  color: var(--swift-label);
  text-align: start;
  cursor: pointer;
}
.context-menu-item:hover:not(:disabled) { background: var(--swift-fill); }
.context-menu-item:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.context-menu-item:disabled { opacity: 0.4; cursor: not-allowed; }
.context-menu-item.destructive { color: var(--swift-red); }
.context-menu-icon { font-size: 16px; }
</style>
