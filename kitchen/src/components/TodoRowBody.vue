<script setup lang="ts">
import { computed } from 'vue'
import { HStack, VStack, Spacer, Text } from '@swiftvue'
import type { Todo } from '../store'

// Everything in a row except the checkbox. Split out because it renders
// both inside a NavigationLink and on its own, and the two had drifted
// apart the moment they were written twice.
const props = defineProps<{ todo: Todo, overdue?: boolean }>()

const PRIORITY_MARK: Record<Todo['priority'], string> = {
  high: '‼️',
  normal: '',
  low: '',
}

const dueLabel = computed(() => {
  const [, month, day] = props.todo.due.split('-')
  return `${month}/${day}`
})
</script>

<template>
  <HStack :spacing="12" alignment="center">
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
.struck {
  text-decoration: line-through;
}
</style>
