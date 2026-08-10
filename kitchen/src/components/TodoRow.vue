<script setup lang="ts">
import { computed } from 'vue'
import { HStack, VStack, Spacer, Text } from '@swiftvue'
import type { Todo } from '../store'

const props = defineProps<{ todo: Todo, overdue?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const PRIORITY_MARK: Record<Todo['priority'], string> = {
  high: '‼️',
  normal: '',
  low: '',
}

const dueLabel = computed(() => {
  const [, month, day] = props.todo.due.split('-')
  return `${month}/${day}`
})

/**
 * The checkbox is a real `<button>` inside the row rather than a click
 * handler on the row itself, so it can be reached by keyboard and announces
 * its state. It stops propagation because the row around it is a
 * NavigationLink, and toggling done is not the same as opening the todo.
 */
function toggle(event: Event) {
  event.stopPropagation()
  emit('toggle')
}
</script>

<template>
  <HStack :spacing="12" :padding="[11, 16]" alignment="center" class="todo-row">
    <button
      type="button"
      class="check"
      role="checkbox"
      :aria-checked="todo.done"
      :aria-label="todo.done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`"
      @click="toggle"
    >
      <span aria-hidden="true">{{ todo.done ? '☑︎' : '☐' }}</span>
    </button>

    <VStack :spacing="2" alignment="leading">
      <Text :class="{ struck: todo.done }" :foreground-color="todo.done ? 'secondaryLabel' : 'label'">
        {{ PRIORITY_MARK[todo.priority] }}{{ todo.title }}
      </Text>
      <Text v-if="todo.notes" font="footnote" foreground-color="secondaryLabel" :line-limit="1">
        {{ todo.notes }}
      </Text>
    </VStack>

    <Spacer />

    <Text v-if="todo.flagged" aria-label="Flagged">🚩</Text>
    <Text font="footnote" :foreground-color="overdue ? 'red' : 'secondaryLabel'">
      {{ dueLabel }}
    </Text>
  </HStack>
</template>

<style scoped>
.todo-row {
  width: 100%;
  /* The row sits on the list's own background; without this the swipe
     actions revealed underneath show through as the row slides. */
  background: var(--swift-background);
}

.check {
  background: none;
  border: none;
  padding: 0;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: var(--swift-accent);
  /* 44×44 is the iOS minimum, and a bare glyph is nowhere near it. */
  min-width: 44px;
  min-height: 44px;
  /* the visual glyph stays where the text expects it */
  margin-inline-start: -12px;
}

.struck {
  text-decoration: line-through;
}
</style>
