<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ScrollView, Section, VStack, HStack, Spacer, Text, Button, Picker,
  DatePicker, TextEditor, Toggle, ContextMenu, useNavigation, onAppear,
  onDisappear, type MenuAction,
} from '@swiftvue'
import { findTodo, updateTodo, removeTodo, PRIORITIES, type Priority } from '../store'
import FormRow from '../components/FormRow.vue'

const props = defineProps<{ id: string }>()
const nav = useNavigation()

const todo = computed(() => findTodo(props.id))

// Proof that onAppear follows visibility rather than mount: push a second
// screen from here and this counter stops; pop back and it goes up again,
// without the screen ever having been unmounted.
const appearances = ref(0)
const visible = ref(false)
onAppear(() => { appearances.value += 1; visible.value = true })
onDisappear(() => { visible.value = false })

const MENU: MenuAction[] = [
  { label: 'Duplicate title to notes', id: 'copy' },
  { label: 'Delete', id: 'delete', role: 'destructive' },
]

function onMenu(action: MenuAction) {
  if (!todo.value) return
  if (action.id === 'copy') updateTodo(props.id, { notes: todo.value.title })
  if (action.id === 'delete') {
    removeTodo(props.id)
    nav?.pop()
  }
}

function set<K extends 'priority' | 'due' | 'notes' | 'flagged' | 'done'>(key: K, value: unknown) {
  updateTodo(props.id, { [key]: value })
}
</script>

<template>
  <ScrollView>
    <VStack v-if="todo" :spacing="16" :padding="[8, 0, 24]">
      <!-- Long press, right click or Shift+F10 — all three reach the menu -->
      <ContextMenu :actions="MENU" label="Todo actions" @select="onMenu">
        <VStack :spacing="4" :padding="[0, 16]" alignment="leading">
          <Text font="largeTitle" bold>{{ todo.title }}</Text>
          <Text font="footnote" foreground-color="secondaryLabel">
            Long press for actions
          </Text>
        </VStack>
      </ContextMenu>

      <Section header="Details">
        <FormRow title="Done">
          <Toggle :model-value="todo.done" label="Done" @update:model-value="set('done', $event)" />
        </FormRow>
        <FormRow title="Flagged">
          <Toggle :model-value="todo.flagged" label="Flagged" @update:model-value="set('flagged', $event)" />
        </FormRow>
        <FormRow title="Priority">
          <Picker
            :model-value="todo.priority"
            :options="PRIORITIES"
            @update:model-value="set('priority', $event as Priority)"
          />
        </FormRow>
        <FormRow title="Due">
          <DatePicker
            :model-value="todo.due"
            displayed-components="date"
            @update:model-value="set('due', $event)"
          />
        </FormRow>
      </Section>

      <Section header="Notes">
        <VStack :padding="[12, 16]">
          <TextEditor
            :model-value="todo.notes"
            placeholder="Nothing yet"
            @update:model-value="set('notes', $event)"
          />
        </VStack>
      </Section>

      <Section header="Lifecycle" footer="onAppear follows visibility, not mount.">
        <HStack :padding="[11, 16]" :spacing="12">
          <Text>Appeared</Text>
          <Spacer />
          <Text data-testid="appear-count" foreground-color="secondaryLabel">
            {{ appearances }}× · {{ visible ? 'visible' : 'covered' }}
          </Text>
        </HStack>
      </Section>

      <VStack :padding="[0, 16]">
        <Button role="destructive" full-width @tap="removeTodo(props.id); nav?.pop()">
          Delete Todo
        </Button>
      </VStack>
    </VStack>

    <!-- Deleting from the row's swipe action while this screen is open pops
         it, but a deep link to a deleted id lands here directly. -->
    <VStack v-else :spacing="12" :padding="24" alignment="center">
      <Text font="title3">This todo is gone.</Text>
      <Button button-style="bordered" @tap="nav?.popToRoot()">Back to the list</Button>
    </VStack>
  </ScrollView>
</template>
