<script setup lang="ts">
import { computed, provide, readonly, ref } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'
import { navigationKey, type NavigationEntry } from '../../composables/useNavigation'

interface Props extends ModifierProps {
  title?: string
  displayMode?: 'large' | 'inline'
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'large',
})

const modifierStyle = useModifiers(props)

const stack = ref<NavigationEntry[]>([])
const direction = ref<'push' | 'pop'>('push')
const depth = computed(() => stack.value.length)

function push(entry: NavigationEntry) {
  direction.value = 'push'
  stack.value = [...stack.value, entry]
}

function pop() {
  if (!stack.value.length) return
  direction.value = 'pop'
  stack.value = stack.value.slice(0, -1)
}

function popToRoot() {
  if (!stack.value.length) return
  direction.value = 'pop'
  stack.value = []
}

provide(navigationKey, { depth: readonly(depth), push, pop, popToRoot })
defineExpose({ push, pop, popToRoot, depth })

const top = computed(() => stack.value[stack.value.length - 1])
const currentTitle = computed(() => top.value?.title ?? props.title)
const backLabel = computed(() => {
  if (depth.value > 1) return stack.value[depth.value - 2].title ?? 'Back'
  return props.title ?? 'Back'
})
// A slot closure ignoring its arguments is a valid functional component.
const topView = computed(() => top.value?.content as unknown as object)

// iOS edge-swipe back: begin near the leading edge, travel right, pop.
let swipeStart: { x: number; y: number } | null = null

function onPointerDown(e: PointerEvent) {
  if (!depth.value) return
  const left = (e.currentTarget as HTMLElement).getBoundingClientRect().left
  if (e.clientX - left <= 28) swipeStart = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
  if (!swipeStart) return
  const dx = e.clientX - swipeStart.x
  const dy = Math.abs(e.clientY - swipeStart.y)
  swipeStart = null
  if (dx > 70 && dy < 60) pop()
}

const style = computed(() => ({
  ...modifierStyle.value,
  display: 'flex',
  flexDirection: 'column' as const,
  height: modifierStyle.value.height ?? '100%',
  backgroundColor: 'var(--swift-grouped-background)',
}))
</script>

<template>
  <div :style="style" @pointerdown="onPointerDown" @pointerup="onPointerUp">
    <header
      v-if="currentTitle || depth > 0"
      :class="['nav-header', depth > 0 ? 'nav-header--inline nav-header--pushed' : `nav-header--${displayMode}`]"
    >
      <button v-if="depth > 0" class="nav-back" aria-label="Back" @click="pop()">
        <span class="nav-back-chevron" aria-hidden="true">‹</span>
        <span class="nav-back-label">{{ backLabel }}</span>
      </button>
      <h1>{{ currentTitle }}</h1>
      <span v-if="depth > 0" class="nav-back-balance" aria-hidden="true" />
    </header>
    <div class="nav-content">
      <Transition :name="`swift-nav-${direction}`">
        <div v-if="depth === 0" key="root" class="nav-pane">
          <slot />
        </div>
        <div v-else :key="depth" class="nav-pane">
          <component :is="topView" />
        </div>
      </Transition>
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
.nav-header--pushed {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}
.nav-header--pushed h1 { min-width: 0; }
.nav-back {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 17px;
  color: var(--swift-primary);
  cursor: pointer;
}
.nav-back:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
.nav-back-chevron { font-size: 26px; line-height: 1; margin-top: -3px; }
.nav-back-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-back-balance { justify-self: end; }

.nav-content { flex: 1; position: relative; overflow: hidden; }
.nav-pane {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  background: var(--swift-grouped-background);
}

/* iOS push/pop: incoming slides from the trailing edge, outgoing parallaxes */
.swift-nav-push-enter-active,
.swift-nav-push-leave-active,
.swift-nav-pop-enter-active,
.swift-nav-pop-leave-active {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}
.swift-nav-push-enter-from { transform: translateX(100%); }
.swift-nav-push-leave-to { transform: translateX(-28%); }
.swift-nav-pop-enter-from { transform: translateX(-28%); }
.swift-nav-pop-leave-to { transform: translateX(100%); }

@media (prefers-reduced-motion: reduce) {
  .swift-nav-push-enter-active,
  .swift-nav-push-leave-active,
  .swift-nav-pop-enter-active,
  .swift-nav-pop-leave-active { transition-duration: 0.01ms; }
}
</style>
