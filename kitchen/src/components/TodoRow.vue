<script setup lang="ts">
import { type VNodeChild } from 'vue'
import { HStack, NavigationLink } from '@swiftvue'
import TodoRowBody from './TodoRowBody.vue'
import type { Todo } from '../store'

defineProps<{ todo: Todo, overdue?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

/**
 * Given a destination, the text half of the row becomes a NavigationLink
 * and the checkbox stays outside it. That split is the reason this
 * component owns the link rather than the screen: a focusable control
 * inside a `role="button"` cannot be reached, because a button is a leaf
 * to assistive technology and everything within it collapses into its
 * name. Stopping the click from propagating hid that from a mouse and
 * left it entirely in place for VoiceOver.
 */
defineSlots<{ destination?: () => VNodeChild }>()
</script>

<template>
  <HStack :spacing="0" alignment="center" class="todo-row">
    <button
      type="button"
      class="check"
      role="checkbox"
      :aria-checked="todo.done"
      :aria-label="todo.done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`"
      @click="emit('toggle')"
    >
      <span aria-hidden="true">{{ todo.done ? '☑︎' : '☐' }}</span>
    </button>

    <NavigationLink
      v-if="$slots.destination"
      :destination-title="todo.title"
      route="todo"
      :param="todo.id"
      :padding="[11, 16, 11, 0]"
      class="todo-row-body"
    >
      <TodoRowBody :todo="todo" :overdue="overdue" />
      <template #destination>
        <slot name="destination" />
      </template>
    </NavigationLink>

    <!-- A completed todo has no detail screen, so the same body renders
         plainly rather than as a link that leads nowhere. -->
    <div v-else class="todo-row-body plain">
      <TodoRowBody :todo="todo" :overdue="overdue" />
    </div>
  </HStack>
</template>

<style scoped>
.todo-row {
  width: 100%;
  /* The row sits on the list's own background; without this the swipe
     actions revealed underneath show through as the row slides. */
  background: var(--swift-background);
}

/* The link is the rest of the row, so the whole strip beside the checkbox
   stays tappable — losing that to the restructure would have traded one
   accessibility problem for a worse usability one. */
.todo-row-body {
  flex: 1;
  min-width: 0;
}

.plain {
  padding: 11px 16px 11px 0;
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
  flex: none;
  /* the glyph lines up with the 16px gutter the rest of the app uses */
  margin-inline-start: 4px;
}
</style>
