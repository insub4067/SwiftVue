<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NavigationSplitView, ScrollView, Section, VStack, HStack, Spacer, Text,
  Divider, useState,
} from '@swiftvue'
import { todos, openTodos, PRIORITIES, type Priority } from '../store'

/**
 * The iPad shape: a menu beside the thing it chose, rather than a screen
 * pushed over the one before it.
 *
 * Kitchen is otherwise a phone app, which is the point of putting this here
 * — the same screen has to be usable at 390px, where the sidebar stops being
 * a column and becomes something you pull over.
 */
type Filter = 'all' | 'open' | 'done' | Priority

const filter = useState<Filter>('all')
const visibility = useState<'automatic' | 'doubleColumn' | 'detailOnly'>('automatic')

const FILTERS: { id: Filter, label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  ...PRIORITIES.map(p => ({ id: p.value as Filter, label: `${p.label} priority` })),
]

const shown = computed(() => {
  if (filter.value === 'all') return todos.value
  if (filter.value === 'open') return openTodos.value
  if (filter.value === 'done') return todos.value.filter(t => t.done)
  return todos.value.filter(t => t.priority === filter.value)
})

const title = computed(() => FILTERS.find(f => f.id === filter.value)?.label ?? 'All')

const split = ref<{ isCompact: boolean } | null>(null)

function choose(id: Filter) {
  filter.value = id
  // Only when the menu is over the content. There it hides the answer to
  // the question just asked, so it has to go; as a column it hides nothing,
  // and closing it would take away the list of filters for no reason.
  if (split.value?.isCompact) visibility.value = 'detailOnly'
}
</script>

<template>
  <NavigationSplitView
    ref="split"
    v-model:column-visibility="visibility"
    label="Filters"
    :sidebar-width="260"
    data-testid="library"
  >
    <template #sidebar>
      <VStack :spacing="0" :padding="[12, 0]" alignment="leading">
        <Text font="headline" :padding="[4, 16, 12]">Library</Text>
        <button
          v-for="item in FILTERS"
          :key="item.id"
          type="button"
          class="filter"
          :class="{ chosen: filter === item.id }"
          :aria-current="filter === item.id ? 'true' : undefined"
          @click="choose(item.id)"
        >{{ item.label }}</button>
      </VStack>
    </template>

    <template #detail>
      <ScrollView>
        <VStack :spacing="16" :padding="[8, 0, 24]">
          <!-- Room for the toggle the split view draws when the sidebar is
               not a column: it sits at the leading edge, 44px square. -->
          <HStack :padding="[8, 16, 0, 60]" :spacing="12">
            <Text font="largeTitle" bold data-testid="filter-title">{{ title }}</Text>
            <Spacer />
          </HStack>

          <Section :header="`${shown.length} of ${todos.length}`">
            <template v-if="shown.length">
              <div v-for="todo in shown" :key="todo.id">
                <HStack :padding="[11, 16]" :spacing="12" alignment="center">
                  <Text :foreground-color="todo.done ? 'secondaryLabel' : 'label'">
                    {{ todo.title }}
                  </Text>
                  <Spacer />
                  <Text font="footnote" foreground-color="secondaryLabel">
                    {{ todo.due.slice(5) }}
                  </Text>
                </HStack>
                <Divider />
              </div>
            </template>
            <HStack v-else :padding="16">
              <Text foreground-color="secondaryLabel">Nothing here.</Text>
            </HStack>
          </Section>
        </VStack>
      </ScrollView>
    </template>
  </NavigationSplitView>
</template>

<style scoped>
.filter {
  width: 100%;
  text-align: start;
  padding: 9px 16px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 15px;
  color: var(--swift-label);
  cursor: pointer;
  border-radius: 8px;
}
.filter:hover { background: var(--swift-fill); }
.filter.chosen {
  background: var(--swift-primary);
  color: #fff;
}
.filter:focus-visible {
  outline: 2px solid var(--swift-primary);
  outline-offset: -2px;
}
</style>
