<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, type VNodeChild } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { serializeRoute, useNavigation, type NavigationEntry } from '../../composables/useNavigation'

interface Props extends ModifierProps {
  /** vue-router destination — renders a router-link instead of pushing */
  to?: string
  /** header title for the pushed view */
  destinationTitle?: string
  /**
   * Names the destination, so an enclosing NavigationStack with a
   * `historyKey` can write it to the URL and reopen it after a reload.
   */
  route?: string
  /** distinguishes rows that share a route — a record id, a slug */
  param?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ tap: [] }>()

// Declared rather than read off useSlots(): only defineSlots reaches the
// emitted .d.ts, so TypeScript consumers can see #destination at all.
const slots = defineSlots<{
  /** the row itself */
  default?: () => VNodeChild
  /** pushed onto the enclosing NavigationStack when the row is activated */
  destination?: () => VNodeChild
}>()
const navigation = useNavigation()
const modifierStyle = useModifiers(props)

// SwiftUI semantics: a NavigationLink with a destination pushes it onto the
// enclosing NavigationStack. Without one it is a plain tappable row.
const pushes = computed(() => !!slots.destination && !!navigation)

const entry = (): NavigationEntry => ({
  title: props.destinationTitle,
  content: () => slots.destination!(),
})

// Registering under `route~param` rather than `route` is what lets a list
// row be named: every row shares the route, so only the param tells them
// apart when a URL asks for one back.
const registryId = computed(() =>
  props.param == null ? props.route : serializeRoute({ id: props.route!, param: props.param }))

onMounted(() => {
  if (!props.route || !pushes.value) return
  const stop = navigation!.registerRoute(registryId.value!, entry)
  onBeforeUnmount(stop)
})

function activate() {
  if (pushes.value) {
    if (props.route) navigation!.pushRoute(props.route, props.param)
    else navigation!.push(entry())
  }
  emit('tap')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    activate()
  }
}

const style = computed(() => composeStyle(modifierStyle.value, {
  display: 'flex',
  alignItems: 'center',
  padding: modifierStyle.value.padding ?? '11px 16px',
  cursor: 'pointer',
  transition: 'background var(--swift-transition)',
  textDecoration: 'none',
  color: 'inherit',
}))
</script>

<template>
  <router-link v-if="to" :to="to" :style="style" class="nav-link">
    <span class="nav-link-content"><slot /></span>
    <span class="nav-link-chevron" aria-hidden="true">›</span>
  </router-link>
  <div
    v-else
    :style="style"
    class="nav-link"
    role="button"
    tabindex="0"
    @click="activate"
    @keydown="onKeydown"
  >
    <span class="nav-link-content"><slot /></span>
    <span class="nav-link-chevron" aria-hidden="true">›</span>
  </div>
</template>

<style scoped>
.nav-link:hover { background: var(--swift-fill); }
.nav-link:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
.nav-link-content { flex: 1; min-width: 0; }
.nav-link-chevron {
  color: var(--swift-tertiary-label);
  font-size: 20px;
  font-weight: 300;
  margin-left: 8px;
}
</style>
