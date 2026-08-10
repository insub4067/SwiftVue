<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Sheet, Form, Section, TextField, TextEditor, Picker, DatePicker, Toggle,
  Button, HStack, VStack, Spacer, Text, onSubmit,
} from '@swiftvue'
import { addTodo, settings, PRIORITIES, type Priority } from '../store'
import FormRow from '../components/FormRow.vue'

const props = defineProps<{ isPresented: boolean }>()
const emit = defineEmits<{ 'update:isPresented': [value: boolean] }>()

const title = ref('')
const notes = ref('')
const priority = ref<Priority>(settings.defaultPriority.value)
const due = ref(new Date().toISOString().slice(0, 10))
const flagged = ref(false)
const attempted = ref(false)

// Opening is what resets the form, not closing: a sheet dismissed by mistake
// and reopened should not silently have kept half a todo.
watch(() => props.isPresented, (open) => {
  if (!open) return
  title.value = ''
  notes.value = ''
  priority.value = settings.defaultPriority.value
  due.value = new Date().toISOString().slice(0, 10)
  flagged.value = false
  attempted.value = false
})

function save() {
  attempted.value = true
  if (!title.value.trim()) return
  addTodo({
    title: title.value.trim(),
    notes: notes.value.trim(),
    priority: priority.value,
    due: due.value,
    flagged: flagged.value,
  })
  emit('update:isPresented', false)
}

// SwiftUI's `.onSubmit` — Return in any field on this screen saves, rather
// than each field wiring its own handler. `<Form>`'s @submit is the button;
// the two are different events and both end up here.
onSubmit(save)
</script>

<template>
  <Sheet
    :is-presented="isPresented"
    :detents="['large']"
    label="New todo"
    @update:is-presented="emit('update:isPresented', $event)"
  >
    <Form @submit="save">
      <VStack :spacing="16" :padding="[8, 0, 24]">
        <HStack :padding="[0, 16]">
          <Text font="title2" bold>New Todo</Text>
          <Spacer />
          <Button button-style="borderless" @tap="emit('update:isPresented', false)">Cancel</Button>
        </HStack>

        <Section header="What">
          <VStack :spacing="12" :padding="[12, 16]">
            <TextField v-model="title" placeholder="Title" text-field-style="roundedBorder" />
            <Text
              v-if="attempted && !title.trim()"
              font="footnote"
              foreground-color="red"
              role="alert"
            >A todo needs a title.</Text>
            <TextEditor v-model="notes" placeholder="Notes" />
          </VStack>
        </Section>

        <Section header="When" footer="Return saves from any field.">
          <VStack :spacing="12" :padding="[12, 16]">
            <Picker v-model="priority" :options="PRIORITIES" picker-style="segmented" />
            <DatePicker v-model="due" displayed-components="date" />
          </VStack>
          <FormRow title="Flag it">
            <Toggle v-model="flagged" label="Flag it" />
          </FormRow>
        </Section>

        <VStack :padding="[0, 16]">
          <Button type="submit" button-style="borderedProminent" full-width>Add Todo</Button>
        </VStack>
      </VStack>
    </Form>
  </Sheet>
</template>
