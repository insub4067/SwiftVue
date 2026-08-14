<script lang="ts">
import type { ModifierProps } from '../../utils/modifiers'

export interface NavigationStackProps extends ModifierProps {
  title?: string
  displayMode?: 'large' | 'inline'
  backButtonVisible?: boolean
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
   *
   * Read once, when the stack first answers the back button. Entries already
   * in history carry the old name, so renaming mid-life would leave them
   * unreachable — changing it warns in development and is otherwise ignored.
   * `browserBack` may be toggled freely.
   */
  historyKey?: string
}

// The one stack on the page that answers the back button. Module scope on
// purpose: the constraint is the browser's single history list, not anything
// about a component tree, so nesting or provide/inject cannot scope it.
let historyOwner: symbol | null = null

function claimHistory(token: symbol): boolean {
  if (historyOwner && historyOwner !== token) return false
  historyOwner = token
  return true
}

function releaseHistory(token: symbol) {
  if (historyOwner === token) historyOwner = null
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, readonly, ref, useId, watch } from 'vue'
import { useModifiers, composeStyle } from '../../utils/modifiers'
import { warnDev } from '../../utils/warn'
import { isRTL } from '../../utils/direction'
import NavPane from './NavPane'
import NavigationBackButton from './NavigationBackButton.vue'
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
  backButtonVisible: true,
})

const modifierStyle = useModifiers(props)

// Each screen carries an id of its own. Keying the panes by array position
// instead lets two different screens that land at the same depth share a
// key, and Vue then patches one into the other rather than remounting — the
// replacement inherits the state of what it replaced.
let nextPaneId = 0
interface Pane { id: number; entry: NavigationEntry }

// `entries` holds every screen we still have a closure for; `cursor` is how
// many of them are showing. They differ only after a history Back, which
// leaves the popped entries behind so Forward has somewhere to go.
const entries = ref<Pane[]>([])
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
// Browser history is one linear list. `history.back()` undoes the most recent
// entry whoever pushed it, and nothing can reach into the middle to remove
// one — so two stacks sharing it would pop each other. Exactly one mounted
// stack answers the back button; the others stay in memory, which is what a
// sidebar or a modal stack wants anyway.
const ownerToken = Symbol('swiftvue-nav-owner')
const ownsHistory = ref(false)

// Namespaced: `history.state` belongs to the host app, and a bare
// `historyKey` would sit on top of whatever its router keeps under that name.
const STATE_KEY = `swiftvue-nav:${props.historyKey ?? useId()}`
let syncingFromHistory = false

const historyEnabled = () => ownsHistory.value && typeof history !== 'undefined'
// Only a stack with a name of its own can claim a query parameter.
const urlEnabled = () => historyEnabled() && !!props.historyKey && typeof location !== 'undefined'

/**
 * The named prefix of the stack. A screen pushed as a bare closure has no
 * name, so the URL describes the last named screen above it rather than
 * inventing one.
 */
function serializableRoutes(): string {
  const named: string[] = []
  for (const pane of stack.value) {
    if (!pane.entry.route) break
    named.push(serializeRoute(pane.entry.route))
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
  const state = { ...(history.state ?? {}), [STATE_KEY]: next }
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
      entries.value = [...entries.value.slice(0, cursor.value), { id: nextPaneId++, entry: { ...entry, route } }]
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
  if (!ownsHistory.value) return
  const target = Number(event.state?.[STATE_KEY] ?? 0)
  if (!Number.isFinite(target) || target === cursor.value) return

  syncingFromHistory = true
  direction.value = target < cursor.value ? 'pop' : 'push'
  // Forward can only reach entries we still hold closures for.
  cursor.value = Math.max(0, Math.min(target, entries.value.length))
  syncingFromHistory = false
}

function takeHistory() {
  if (typeof history === 'undefined' || ownsHistory.value) return
  if (!claimHistory(ownerToken)) {
    warnDev(
      'NavigationStack: another stack on this page already answers the back button, ' +
      'so this one stays in memory. Browser history is a single linear list — two ' +
      'stacks sharing it would pop each other.',
    )
    return
  }
  ownsHistory.value = true

  if (urlEnabled()) {
    const value = new URL(location.href).searchParams.get(props.historyKey!)
    if (value) pending = parseRoutes(value)
  }
  recordDepth(0, true) // stamp the root so Back from depth 1 has a target
  window.addEventListener('popstate', onPopState)
  drainPending()
}

function giveUpHistory() {
  releaseHistory(ownerToken)
  ownsHistory.value = false
  if (typeof window !== 'undefined') window.removeEventListener('popstate', onPopState)
}

// browserBack can be turned on and off while the stack lives — a tab that
// becomes the main content takes the seat, and hands it back when it stops
// being. `historyKey` cannot: entries already in history carry the old key,
// and renaming would orphan them.
onMounted(() => {
  if (props.browserBack) takeHistory()
})

watch(() => props.browserBack, (on) => (on ? takeHistory() : giveUpHistory()))

watch(() => props.historyKey, () => warnDev(
  'NavigationStack: historyKey is read once, when the stack first answers the ' +
  'back button. Entries already in history carry the old name, so changing it ' +
  'now would leave them unreachable. Give the stack a key that does not change.',
))

onBeforeUnmount(giveUpHistory)

function push(entry: NavigationEntry) {
  // A push during a restore would fight the URL we are replaying.
  if (restoring) return
  direction.value = 'push'
  // A push after a Back forks: whatever Forward pointed at is unreachable
  // now, exactly as pushState drops the browser's own forward entries.
  entries.value = [...entries.value.slice(0, cursor.value), { id: nextPaneId++, entry }]
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

const top = computed(() => stack.value[stack.value.length - 1]?.entry)
const currentTitle = computed(() => top.value?.title ?? props.title)
// index 0 is the root slot; entries follow. A content closure ignoring its
// arguments is a valid functional component.
const panes = computed(() => [null, ...stack.value] as Array<Pane | null>)

// iOS edge-swipe back: begin near the leading edge, travel right, pop.
let swipeStart: { x: number; y: number } | null = null

// Back travels from the leading edge inwards — which physical edge that is
// depends on the writing direction, so the gesture mirrors with it.
function onPointerDown(e: PointerEvent) {
  if (!depth.value) return
  const el = e.currentTarget as HTMLElement
  const box = el.getBoundingClientRect()
  const fromEdge = isRTL(el) ? box.right - e.clientX : e.clientX - box.left
  if (fromEdge <= 28) swipeStart = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
  if (!swipeStart) return
  const travelled = e.clientX - swipeStart.x
  const inwards = isRTL(e.currentTarget as HTMLElement) ? -travelled : travelled
  const dy = Math.abs(e.clientY - swipeStart.y)
  swipeStart = null
  if (inwards > 70 && dy < 60) pop()
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
      :class="['nav-header', 'swift-navigation-edge', depth > 0 ? 'nav-header--inline nav-header--pushed' : `nav-header--${displayMode}`]"
    >
      <span v-if="depth > 0" class="nav-back-slot">
        <NavigationBackButton :visible="backButtonVisible" @back="pop" />
      </span>
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
          v-for="(pane, i) in panes"
          :key="pane ? `pane-${pane.id}` : 'root'"
          class="nav-pane"
          :class="{ 'nav-pane--under': i < depth }"
          :inert="i < depth"
        >
          <NavPane :active="i === depth">
            <slot v-if="i === 0" />
            <component :is="pane!.entry.content" v-else />
          </NavPane>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.nav-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  padding: 0 16px;
  background-color: var(--swift-navigation-edge);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  backdrop-filter: blur(22px) saturate(180%);
  box-shadow: inset 0 -1px 0 var(--swift-glass-border);
}
.nav-header--large h1 {
  font-size: 34px;
  font-weight: 700;
  line-height: 41px;
  margin: 16px 0 8px;
  color: var(--swift-label);
}
.nav-header--inline {
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
.nav-back-slot {
  justify-self: start;
  width: 44px;
  height: 44px;
}
.nav-back-balance { justify-self: end; width: 44px; }

.nav-content { flex: 1; position: relative; overflow: hidden; }
.nav-pane {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding-bottom: var(--swift-tab-bar-clearance, 0px);
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

@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .nav-header { background-color: var(--swift-secondary-background); }
}

@media (prefers-reduced-transparency: reduce) {
  .nav-header {
    background-color: var(--swift-secondary-background);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
</style>
