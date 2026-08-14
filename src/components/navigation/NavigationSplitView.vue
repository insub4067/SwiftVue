<script lang="ts">
/**
 * SwiftUI's `NavigationSplitViewVisibility`. Two columns rather than three,
 * so `all` and `doubleColumn` mean the same thing and only the latter is
 * offered — a name that promised a third column would be a lie.
 */
export type SplitViewVisibility = 'automatic' | 'doubleColumn' | 'detailOnly'

export interface NavigationSplitViewProps extends ModifierProps {
  /** v-model. `automatic` follows the width: open when regular, shut when compact. */
  columnVisibility?: SplitViewVisibility
  /** SwiftUI's `.navigationSplitViewColumnWidth()`, in px */
  sidebarWidth?: number
  /**
   * Below this width the sidebar stops being a column and becomes an
   * overlay. 768 is the iPad's portrait width in CSS pixels, which is where
   * iPadOS itself makes the same switch.
   */
  compactWidth?: number
  /** announced as the sidebar's name */
  label?: string
  /**
   * The library draws a toggle when the sidebar cannot be reached any other
   * way. Set this if your own toolbar already has one.
   */
  hidesToggle?: boolean
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { isRTL } from '../../utils/direction'

const props = withDefaults(defineProps<NavigationSplitViewProps>(), {
  columnVisibility: 'automatic',
  sidebarWidth: 320,
  compactWidth: 768,
})

const emit = defineEmits<{ 'update:columnVisibility': [value: SplitViewVisibility] }>()

defineSlots<{
  /** the menu — a List with `list-style="sidebar"` is the iPad look */
  sidebar?: () => unknown
  /** whatever the selected item shows */
  detail?: () => unknown
}>()

const root = ref<HTMLElement | null>(null)
const sidebarEl = ref<HTMLElement | null>(null)
const sidebarId = `swiftvue-sidebar-${useId()}`
let previouslyFocused: HTMLElement | null = null

/**
 * Regular or compact, from the viewport rather than from the element.
 *
 * `matchMedia` and not a ResizeObserver: the observer would measure this
 * component's own box, which is the right answer for a split view nested in
 * something narrow and the wrong one for the case that matters — and it
 * would drag an API into the support floor that nothing else here needs.
 */
const regular = ref(true)
let query: MediaQueryList | null = null

function watchWidth(width: number) {
  if (typeof matchMedia === 'undefined') return
  stopWatchingWidth()
  query = matchMedia(`(min-width: ${width}px)`)
  regular.value = query.matches
  query.addEventListener('change', onWidthChange)
}

function onWidthChange(e: MediaQueryListEvent) {
  regular.value = e.matches
}

function stopWatchingWidth() {
  query?.removeEventListener('change', onWidthChange)
  query = null
}

watch(() => props.compactWidth, watchWidth, { immediate: true })
onBeforeUnmount(stopWatchingWidth)

const compact = computed(() => !regular.value)

/**
 * `automatic` is resolved here rather than written back to the prop: a
 * component that answered a width change by mutating its own model would
 * turn a rotation into an app-visible state change nobody asked for.
 */
const sidebarShown = computed(() => {
  if (props.hidden) return false
  if (props.columnVisibility === 'automatic') return regular.value
  return props.columnVisibility === 'doubleColumn'
})

/** The sidebar is over the detail rather than beside it. */
const overlaid = computed(() => compact.value && sidebarShown.value)

function setVisibility(next: SplitViewVisibility) {
  emit('update:columnVisibility', next)
}

function toggleSidebar() {
  setVisibility(sidebarShown.value ? 'detailOnly' : 'doubleColumn')
}

defineExpose({ toggleSidebar, isCompact: compact, isSidebarShown: sidebarShown })

// An overlaid sidebar is over the content, so it takes the keyboard with it
// — anything else leaves Tab wandering behind a visible panel. A sidebar
// that is simply a column takes nothing: it is part of the page.
function onKeydown(e: KeyboardEvent) {
  if (!overlaid.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    setVisibility('detailOnly')
    return
  }
  if (e.key !== 'Tab' || !sidebarEl.value) return
  const focusable = sidebarEl.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

// immediate: a split view mounted already overlaid — a phone-width page
// restoring an open menu — must take the keyboard too, not only one that
// opens later.
watch(overlaid, async (isOverlaid, was) => {
  if (isOverlaid) {
    previouslyFocused = document.activeElement as HTMLElement | null
    await nextTick()
    const first = sidebarEl.value?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    // The panel itself when there is nothing in it to focus, so Escape has
    // somewhere to be heard from.
    if (first) first.focus()
    else sidebarEl.value?.focus()
  } else if (was) {
    previouslyFocused?.focus()
    previouslyFocused = null
  }
}, { immediate: true })

const modifierStyle = useModifiers(props)

const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  height: modifierStyle.value.height ?? '100%',
  width: '100%',
}, {
  // Structural, so a modifier cannot take the ground out from under the
  // overlay it positions against.
  position: 'relative',
  overflow: 'hidden',
}))

const sidebarStyle = computed(() => {
  const width = `${props.sidebarWidth}px`
  if (!compact.value) {
    return {
      width,
      // A flex item shrinks to its content by default, which on a narrow
      // detail hands the sidebar's width to whatever is inside it.
      flex: `0 0 ${width}`,
      // Collapsed by width rather than unmounted, so the menu keeps its
      // scroll position and anything typed into it across a toggle.
      marginInlineStart: sidebarShown.value ? '0' : `-${width}`,
    }
  }
  return {
    width,
    maxWidth: '85%',
    position: 'absolute' as const,
    insetBlock: '0',
    insetInlineStart: '0',
    zIndex: '2',
    // A glyph-free transform, so it has to be mirrored by hand: `translateX`
    // is physical however logical the inset beside it is.
    transform: sidebarShown.value ? 'none' : `translateX(${mirrored(-100)}%)`,
  }
})

function mirrored(percent: number) {
  return isRTL(root.value) ? -percent : percent
}
</script>

<template>
  <div ref="root" class="swift-split" :style="style" @keydown="onKeydown">
    <aside
      :id="sidebarId"
      ref="sidebarEl"
      class="swift-split-sidebar swift-liquid-glass swift-liquid-glass--prominent"
      :class="{
        'swift-split-sidebar--overlaid': overlaid,
        'swift-split-sidebar--toggle-space': overlaid && !hidesToggle,
      }"
      :style="sidebarStyle"
      :aria-label="label ?? 'Sidebar'"
      :aria-hidden="sidebarShown ? undefined : 'true'"
      :inert="sidebarShown ? undefined : true"
      tabindex="-1"
    >
      <slot name="sidebar" />
    </aside>

    <!-- Only over an overlaid sidebar. A sidebar that is a column has
         nothing to dim: the detail beside it is still usable. -->
    <div
      v-if="overlaid"
      class="swift-split-scrim"
      @click="setVisibility('detailOnly')"
    />

    <div class="swift-split-detail">
      <button
        v-if="!hidesToggle && (compact || !sidebarShown)"
        type="button"
        class="swift-split-toggle swift-liquid-glass swift-liquid-glass--circle"
        :aria-expanded="sidebarShown"
        :aria-controls="sidebarId"
        aria-label="Sidebar"
        @click="toggleSidebar"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <slot name="detail" />
    </div>
  </div>
</template>

<style scoped>
.swift-split-sidebar {
  border-inline-end: 1px solid var(--swift-separator);
  overflow-y: auto;
  transition: margin var(--swift-transition), transform var(--swift-transition);
}

.swift-split-sidebar--overlaid {
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.18);
}

.swift-split-sidebar--toggle-space { padding-block-start: 60px; }

.swift-split-scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.28);
}

.swift-split-detail {
  flex: 1;
  /* Without this the detail refuses to shrink below its content and pushes
     the sidebar off the screen — rule 2 of the layout contract. */
  min-width: 0;
  position: relative;
  overflow-y: auto;
}

.swift-split-toggle {
  position: absolute;
  top: 8px;
  inset-inline-start: 8px;
  z-index: 3;
  width: 44px;
  height: 44px;
  color: var(--swift-primary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
}
.swift-split-toggle:hover { background-color: var(--swift-navigation-glass-prominent); }
.swift-split-toggle:active { transform: scale(0.96); }
.swift-split-toggle:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .swift-split-sidebar { transition-duration: 0.01ms; }
}
</style>
