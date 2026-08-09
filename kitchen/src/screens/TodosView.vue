<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NavigationStack, NavigationLink, ScrollView, Section, SwipeActions,
  VStack, HStack, Spacer, Text, Button, Alert, useState,
  type SwipeAction,
} from '@swiftvue'
import { settings, todos, visibleTodos, openTodos, removeTodo, toggleDone, updateTodo, clearAll, restoreSeed, type Todo } from '../store'
import TodoRow from '../components/TodoRow.vue'
import TodoDetailView from './TodoDetailView.vue'
import TodoEditorSheet from './TodoEditorSheet.vue'

const editorOpen = useState(false)
const confirmingClear = useState(false)
const lastAction = ref('')

const overdue = computed(() => visibleTodos.value.filter(t => !t.done && t.due < today.value))
const upcoming = computed(() => visibleTodos.value.filter(t => !t.done && t.due >= today.value))
const completed = computed(() => visibleTodos.value.filter(t => t.done))

// A fixed "today" would make the Overdue section a lie by next week, and
// `new Date()` in a computed would be read once and never again. A ref set
// on load is honest enough for a demo and stable within a session.
const today = ref(new Date().toISOString().slice(0, 10))

const ROW_ACTIONS: SwipeAction[] = [
  { label: 'Delete', id: 'delete', role: 'destructive' },
  { label: 'Flag', id: 'flag', tint: 'orange' },
]

function onSwipe(todo: Todo, action: SwipeAction) {
  if (action.id === 'delete') {
    removeTodo(todo.id)
    lastAction.value = `Deleted "${todo.title}"`
  } else if (action.id === 'flag') {
    updateTodo(todo.id, { flagged: !todo.flagged })
    lastAction.value = todo.flagged ? `Flagged "${todo.title}"` : `Unflagged "${todo.title}"`
  }
}

function onClearAction(label: string) {
  if (label === 'Delete All') {
    clearAll()
    lastAction.value = 'Deleted everything'
  }
}

/**
 * `.refreshable` wants a promise, and the spinner holds until it settles —
 * so a fake reload has to actually take time or the gesture looks broken.
 */
function reload() {
  return new Promise<void>((resolve) => {
    today.value = new Date().toISOString().slice(0, 10)
    setTimeout(resolve, 600)
  })
}
</script>

<template>
  <NavigationStack title="Todos" browser-back history-key="todos">
    <ScrollView :refreshable="reload">
      <VStack :spacing="16" :padding="[8, 0, 24]">
        <HStack :padding="[0, 16]" :spacing="12">
          <Text font="subheadline" foreground-color="secondaryLabel">
            {{ openTodos.length }} open · {{ todos.length }} total
          </Text>
          <Spacer />
          <Button button-style="borderedProminent" @tap="editorOpen = true">＋ New</Button>
        </HStack>

        <Section v-if="overdue.length" header="Overdue">
          <SwipeActions
            v-for="todo in overdue" :key="todo.id"
            :trailing="ROW_ACTIONS"
            @select="onSwipe(todo, $event)"
          >
            <NavigationLink :destination-title="todo.title" route="todo" :param="todo.id">
              <TodoRow :todo="todo" overdue @toggle="toggleDone(todo.id)" />
              <template #destination>
                <TodoDetailView :id="todo.id" />
              </template>
            </NavigationLink>
          </SwipeActions>
        </Section>

        <Section header="Upcoming" :footer="upcoming.length ? undefined : 'Nothing scheduled.'">
          <SwipeActions
            v-for="todo in upcoming" :key="todo.id"
            :trailing="ROW_ACTIONS"
            @select="onSwipe(todo, $event)"
          >
            <NavigationLink :destination-title="todo.title" route="todo" :param="todo.id">
              <TodoRow :todo="todo" @toggle="toggleDone(todo.id)" />
              <template #destination>
                <TodoDetailView :id="todo.id" />
              </template>
            </NavigationLink>
          </SwipeActions>
        </Section>

        <Section
          v-if="completed.length"
          header="Completed"
          collapsible
          :default-expanded="false"
        >
          <SwipeActions
            v-for="todo in completed" :key="todo.id"
            :trailing="[{ label: 'Delete', id: 'delete', role: 'destructive' }]"
            @select="onSwipe(todo, $event)"
          >
            <TodoRow :todo="todo" @toggle="toggleDone(todo.id)" />
          </SwipeActions>
        </Section>

        <VStack :padding="[8, 16]" :spacing="8">
          <Button role="destructive" full-width @tap="confirmingClear = true">
            Delete All
          </Button>
          <Button button-style="bordered" full-width @tap="restoreSeed()">
            Restore Examples
          </Button>
          <!-- aria-live, so a swipe that removed a row is announced -->
          <Text
            v-if="lastAction"
            font="footnote"
            foreground-color="secondaryLabel"
            role="status"
            aria-live="polite"
          >{{ lastAction }}</Text>
        </VStack>
      </VStack>
    </ScrollView>

    <TodoEditorSheet v-model:is-presented="editorOpen" />

    <Alert
      v-model:is-presented="confirmingClear"
      title="Delete all todos?"
      :message="settings.confirmDelete.value ? 'This cannot be undone.' : undefined"
      :actions="[
        { label: 'Cancel', role: 'cancel' },
        { label: 'Delete All', role: 'destructive' },
      ]"
      @action="onClearAction"
    />
  </NavigationStack>
</template>
