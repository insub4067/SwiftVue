<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { TabView, useState } from '@swiftvue'
import { openTodos, settings } from './store'
import TodosView from './screens/TodosView.vue'
import SettingsView from './screens/SettingsView.vue'

const tab = useState('todos')

const tabs = computed(() => [
  // SwiftUI's `.badge(_:)`. Zero shows nothing, as it does on iOS, so the
  // count can be passed straight through with no `v-if` around it.
  { id: 'todos', label: 'Todos', icon: '☑️', badge: openTodos.value.length },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
])

// The writing direction belongs on the document, not on a wrapper: `dir` is
// inherited, and a portalled overlay is not inside any wrapper this app
// renders. Setting it here is what makes the RTL setting reach a Sheet.
watchEffect(() => {
  const dir = settings.direction.value
  if (dir === 'auto') document.documentElement.removeAttribute('dir')
  else document.documentElement.setAttribute('dir', dir)
})
</script>

<template>
  <TabView v-model="tab" :tabs="tabs">
    <!--
      A tab's content is a named slot, and only the selected one renders.
      Only the todos stack answers the browser Back button: history is a
      single list, and two stacks pushing onto it would undo each other's
      entries.
    -->
    <template #todos><TodosView /></template>
    <template #settings><SettingsView /></template>
  </TabView>
</template>
