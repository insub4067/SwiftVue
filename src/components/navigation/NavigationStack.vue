<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface NavigationStackProps extends ModifierProps {
  title?: string
  displayMode?: 'large' | 'inline'
  /**
   * Give the browser's Back and Forward control of the stack, so the system
   * back gesture and the hardware back button pop instead of leaving the app.
   *
   * This is history integration, not routing. The URL never changes: entries
   * are closures the app owns, so a reload or a shared link starts at the
   * root, and a screen reached by Forward is rebuilt rather than restored.
   * Off by default, since a stack that is not the page's main content
   * should not answer the back button.
   */
  browserBack?: boolean
  /**
   * A stable name for this stack. Give it one and, together with
   * `browserBack`, named screens are written to the URL as
   * `?<historyKey>=general/profile~42` — so a reload or a shared link
   * reopens them. Without it the stack still works, it just cannot be
   * described in a URL.
   *
   * A screen is named by `NavigationLink route="…"` or by
   * `useNavigation().registerRoute()`; one pushed as a bare closure has no
   * name, and the link stops at the last named screen above it.
   */
  historyKey?: string
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, readonly, ref, useId } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'
import {
  navigationKey,
  parseRoutes,
  serializeRoute,
  type NavigationEntry,
  type RouteFactory,
  type RouteRef,
} from '../../composables/useNavigation'

const props = withDefaults(defineProps<NavigationStackProps>(), {
  displayMode: 'large',
})

const modifierStyle = useModifiers(props)

// `entries` holds every screen we still have a closure for; `cursor` is how
// many of them are showing. They differ only after a history Back, which
// leaves the popped entries behind so Forward has somewhere to go.
const entries = ref<NavigationEntry[]>([])
const cursor = ref(0)
const stack = computed(() => entries.value.slice(0, cursor.value))
const direction = ref<'push' | 'pop'>('push')
const depth = computed(() => cursor.value)

// --- browser history (browserBack) --------------------------------------
// History carries the depth. An entry's content is a closure owned by the
// component that pushed it, and no closure survives a reload — so a screen
// comes back only if it also has a name the route registry can rebuild it
// from. Unnamed screens legitimately end at the root on refresh.
//
// The key is per stack, so a tabbed app can give every tab its own history.
// A popstate that does not move this stack's depth leaves it alone.
const fallbackKey = `swiftvue-nav-${useId()}`
const HISTORY_KEY = computed(() => props.historyKey ?? fallbackKey)
let syncingFromHistory = false

const historyEnabled = () => props.browserBack && typeof history !== 'undefined'
// Only a stack with a name of its own can claim a query parameter.
const urlEnabled = () => historyEnabled() && !!props.historyKey && typeof location !== 'undefined'

/**
 * The named prefix of the stack. A screen pushed as a bare closure has no
 * name, so the URL describes the last named screen above it rather than
 * inventing one.
 */
function serializableRoutes(): string {
  const named: string[] = []
  for (const entry of stack.value) {
    if (!entry.route) break
    named.push(serializeRoute(entry.route))
  }
  return named.join('/')
}

function nextUrl(): string | undefined {
  if (!urlEnabled()) return undefined
  const url = new URL(location.href)
  const value = serializableRoutes()
  if (value) url.searchParams.set(props.historyKey!, value)
  else url.searchParams.delete(props.historyKey!)
  return url.pathname + url.search + url.hash
}

function recordDepth(next: number, replace = false) {
  if (!historyEnabled() || syncingFromHistory) return
  const state = { ...(history.state ?? {}), [HISTORY_KEY.value]: next }
  if (replace) history.replaceState(state, '', nextUrl())
  else history.pushState(state, '', nextUrl())
}

// --- route registry ------------------------------------------------------
// Registered by NavigationLink as rows mount, or by hand through
// useNavigation().registerRoute. Restoring a deep link is therefore staged:
// each screen that comes back mounts the links that can rebuild the next.
const registry = new Map<string, RouteFactory>()
let pending: RouteRef[] = []
let restoring = false
let drainQueued = false

function lookup(route: RouteRef): NavigationEntry | null {
  // A link inside a ForEach registers under its own param, so a list row is
  // reachable by name; a hand-written factory registers the bare id instead.
  const exact = route.param == null ? null : registry.get(serializeRoute(route))
  const build = exact ?? registry.get(route.id)
  return build ? build(route.param) : null
}

function drainPending() {
  if (drainQueued || !pending.length) return
  drainQueued = true
  nextTick(() => {
    drainQueued = false
    restoring = true
    let restored = false
    while (pending.length) {
      const entry = lookup(pending[0])
      if (!entry) break // its link has not mounted yet, or never will
      const route = pending.shift()!
      entries.value = [...entries.value.slice(0, cursor.value), { ...entry, route }]
      cursor.value = entries.value.length
      restored = true
    }
    restoring = false
    // Replace rather than push: reopening a link is where the user already
    // is, not somewhere they navigated to.
    if (restored) recordDepth(cursor.value, true)
    if (pending.length && restored) drainPending()
  })
}

function registerRoute(id: string, build: RouteFactory) {
  registry.set(id, build)
  drainPending()
  return () => {
    if (registry.get(id) === build) registry.delete(id)
  }
}

function pushRoute(id: string, param?: string) {
  const route: RouteRef = param == null ? { id } : { id, param }
  const entry = lookup(route)
  if (!entry) return
  push({ ...entry, route })
}

function onPopState(event: PopStateEvent) {
  if (!props.browserBack) return
  const target = Number(event.state?.[HISTORY_KEY.value] ?? 0)
  if (!Number.isFinite(target) || target === cursor.value) return

  syncingFromHistory = true
  direction.value = target < cursor.value ? 'pop' : 'push'
  // Forward can only reach entries we still hold closures for.
  cursor.value = Math.max(0, Math.min(target, entries.value.length))
  syncingFromHistory = false
}

onMounted(() => {
  if (!historyEnabled()) return
  if (urlEnabled()) {
    const value = new URL(location.href).searchParams.get(props.historyKey!)
    if (value) pending = parseRoutes(value)
  }
  recordDepth(0, true) // stamp the root so Back from depth 1 has a target
  window.addEventListener('popstate', onPopState)
  drainPending()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('popstate', onPopState)
})

function push(entry: NavigationEntry) {
  // A push during a restore would fight the URL we are replaying.
  if (restoring) return
  direction.value = 'push'
  // A push after a Back forks: whatever Forward pointed at is unreachable
  // now, exactly as pushState drops the browser's own forward entries.
  entries.value = [...entries.value.slice(0, cursor.value), entry]
  cursor.value = entries.value.length
  recordDepth(cursor.value)
}

function pop() {
  if (!cursor.value) return
  // Let the browser drive, so its Back stack and ours never disagree. The
  // popstate handler moves the cursor and keeps the entry for Forward.
  if (historyEnabled() && !syncingFromHistory) { history.back(); return }
  direction.value = 'pop'
  cursor.value -= 1
  // Without history there is no Forward, so nothing can reach this again.
  entries.value = entries.value.slice(0, cursor.value)
}

function popToRoot() {
  if (!cursor.value) return
  if (historyEnabled() && !syncingFromHistory) { history.go(-cursor.value); return }
  direction.value = 'pop'
  cursor.value = 0
  entries.value = []
}

provide(navigationKey, { depth: readonly(depth), push, pop, popToRoot, pushRoute, registerRoute })
defineExpose({ push, pop, popToRoot, pushRoute, registerRoute, depth })

const top = computed(() => stack.value[stack.value.length - 1])
const currentTitle = computed(() => top.value?.title ?? props.title)
const backLabel = computed(() => {
  if (depth.value > 1) return stack.value[depth.value - 2].title ?? 'Back'
  return props.title ?? 'Back'
})
// index 0 is the root slot; entries follow. A content closure ignoring its
// arguments is a valid functional component.
const panes = computed(() => [null, ...stack.value] as Array<NavigationEntry | null>)

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

const style = computed(() => composeStyle(modifierStyle.value, {
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
      <button v-if="depth > 0" type="button" class="nav-back" aria-label="Back" @click="pop()">
        <span class="nav-back-chevron" aria-hidden="true">‹</span>
        <span class="nav-back-label">{{ backLabel }}</span>
      </button>
      <h1>{{ currentTitle }}</h1>
      <span v-if="depth > 0" class="nav-back-balance" aria-hidden="true" />
    </header>
    <div class="nav-content">
      <!--
        Every pane stays mounted: SwiftUI keeps views below the top alive, so
        popping must return to the previous view exactly as it was left —
        scroll position, field contents, local state. Buried panes sit behind
        the opaque top pane, parallax-shifted and inert.
      -->
      <TransitionGroup :name="`swift-nav-${direction}`">
        <div
          v-for="(entry, i) in panes"
          :key="i"
          class="nav-pane"
          :class="{ 'nav-pane--under': i < depth }"
          :inert="i < depth"
        >
          <slot v-if="i === 0" />
          <component :is="entry!.content" v-else />
        </div>
      </TransitionGroup>
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
  /* class-driven: buried panes parallax to -28% and back on pop */
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}
.nav-pane--under { transform: translateX(-28%); }

/* iOS push/pop for the pane entering or leaving at the top of the stack */
.swift-nav-push-enter-from { transform: translateX(100%); }
.swift-nav-pop-leave-to { transform: translateX(100%); }
.swift-nav-pop-leave-active { z-index: 1; }

@media (prefers-reduced-motion: reduce) {
  .nav-pane { transition-duration: 0.01ms; }
}
</style>
