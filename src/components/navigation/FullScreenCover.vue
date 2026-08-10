<script lang="ts">
export interface FullScreenCoverProps extends ModifierProps {
  isPresented: boolean
  /** announced as the cover's name */
  label?: string
}
</script>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'

/**
 * SwiftUI's `.fullScreenCover(isPresented:)`.
 *
 * Not a taller `Sheet`. A sheet is a card over a page you can still see and
 * dismiss by reaching past it; a cover replaces the screen. There is no
 * backdrop, because there is nothing left showing to dim, and no
 * swipe-to-dismiss — on iOS a cover is left deliberately, which is why
 * SwiftUI makes you provide the way out.
 *
 * **Escape closes it, and iOS has no such thing.** A modal that takes the
 * keyboard and offers it no way back is a keyboard trap, which the web does
 * not get to call a design decision. Providing a visible close button is
 * still your job — Escape is the floor, not the affordance.
 */
const props = defineProps<FullScreenCoverProps>()

const emit = defineEmits<{ 'update:isPresented': [value: boolean]; dismiss: [] }>()

const coverEl = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const modifierStyle = useModifiers(props)

// `hidden` has to win here as everywhere else, and it is the whole screen
// that would otherwise stay covered.
const visible = computed(() => props.isPresented && !props.hidden)

const style = computed(() => composeStyle(modifierStyle.value, {
  background: 'var(--swift-background)',
}, {
  // Structural: a cover that a modifier could unstick from the viewport
  // would leave the page half-covered, which is worse than either state.
  position: 'fixed',
  inset: '0',
  zIndex: '1000',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'auto',
}))

function dismiss() {
  emit('update:isPresented', false)
  emit('dismiss')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    dismiss()
    return
  }
  if (e.key !== 'Tab' || !coverEl.value) return
  const focusable = coverEl.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  // Nothing to move to, so Tab has nowhere to go but out — and out is
  // behind the cover.
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

// Remember what the page had rather than assuming '': a sheet or another
// cover may already own the lock, and clearing it would let the page scroll
// underneath.
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

// immediate: a cover mounted already up must trap focus and lock scrolling
// too, not only one raised later.
watch(visible, async (up) => {
  if (up) {
    previouslyFocused = document.activeElement as HTMLElement | null
    lockScroll()
    await nextTick()
    const first = coverEl.value?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    // The cover itself when it holds nothing focusable, so Escape has
    // somewhere to be heard from at all.
    if (first) first.focus()
    else coverEl.value?.focus()
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
    <Transition name="swift-cover">
      <div
        v-if="visible"
        ref="coverEl"
        class="swift-cover"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        :style="style"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Up from the bottom, as iOS raises it. No fade: there is nothing behind
   to fade against once it has arrived. */
.swift-cover-enter-active,
.swift-cover-leave-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.swift-cover-enter-from,
.swift-cover-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .swift-cover-enter-active,
  .swift-cover-leave-active { transition-duration: 0.01ms; }
}
</style>
