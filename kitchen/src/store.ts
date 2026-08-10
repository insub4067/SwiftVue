// The app's data, in one place.
//
// Everything here is backed by `useAppStorage`, which is SwiftUI's
// `@AppStorage`: a ref that writes through to localStorage and follows a
// change made in another tab. Because these are created at module scope
// there is one of each for the whole app, which is what makes this a store
// rather than a composable — importing it twice gets the same refs.
import { computed } from 'vue'
import { useAppStorage } from '@swiftvue'

export type Priority = 'low' | 'normal' | 'high'

export interface Todo {
  id: string
  title: string
  notes: string
  priority: Priority
  /** yyyy-mm-dd, the shape `<input type="date">` speaks */
  due: string
  done: boolean
  flagged: boolean
}

export const PRIORITIES: { label: string, value: Priority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
]

/** Fixed dates so a screenshot taken today matches one taken next month. */
const SEED: Todo[] = [
  { id: 'seed-1', title: 'Buy milk', notes: '', priority: 'normal', due: '2026-01-12', done: false, flagged: false },
  { id: 'seed-2', title: 'Renew passport', notes: 'Photo booth on the corner does the right size.', priority: 'high', due: '2026-02-01', done: false, flagged: true },
  { id: 'seed-3', title: 'Water the plants', notes: '', priority: 'low', due: '2026-01-10', done: true, flagged: false },
]

export const todos = useAppStorage<Todo[]>('kitchen.todos', SEED)

export const settings = {
  /** null follows the system, which is what `usePreferredColorScheme` wants */
  hideCompleted: useAppStorage('kitchen.hideCompleted', false),
  defaultPriority: useAppStorage<Priority>('kitchen.defaultPriority', 'normal'),
  /** how many days before a due date a todo counts as approaching */
  reminderLeadDays: useAppStorage('kitchen.reminderLeadDays', 2),
  /** 'auto' takes the document's direction; the others force one */
  direction: useAppStorage<'auto' | 'ltr' | 'rtl'>('kitchen.direction', 'auto'),
  confirmDelete: useAppStorage('kitchen.confirmDelete', true),
}

export const openTodos = computed(() => todos.value.filter(t => !t.done))

export const visibleTodos = computed(() =>
  settings.hideCompleted.value ? openTodos.value : todos.value)

export function findTodo(id: string): Todo | undefined {
  return todos.value.find(t => t.id === id)
}

// Ids have to survive a reload, and two todos added in the same millisecond
// still have to differ — a counter alone repeats after a refresh, a
// timestamp alone collides.
let seq = 0
function newId() {
  seq += 1
  return `todo-${Date.now().toString(36)}-${seq}`
}

export function addTodo(fields: Omit<Todo, 'id' | 'done'>): Todo {
  const todo: Todo = { ...fields, id: newId(), done: false }
  todos.value = [todo, ...todos.value]
  return todo
}

export function updateTodo(id: string, fields: Partial<Omit<Todo, 'id'>>) {
  const todo = findTodo(id)
  if (todo) Object.assign(todo, fields)
}

export function removeTodo(id: string) {
  todos.value = todos.value.filter(t => t.id !== id)
}

export function toggleDone(id: string) {
  const todo = findTodo(id)
  if (todo) todo.done = !todo.done
}

export function clearAll() {
  todos.value = []
}

export function restoreSeed() {
  todos.value = SEED.map(t => ({ ...t }))
}
