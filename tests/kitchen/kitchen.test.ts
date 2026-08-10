// Kitchen is the app SwiftVue is tested against, so its screens are mounted
// here rather than only built. A component test that mounts the library's
// own demo screens catches the class of break a per-component test cannot:
// one where each part still works and the assembly does not.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../../kitchen/src/App.vue'
import TodosView from '../../kitchen/src/screens/TodosView.vue'
import TodoDetailView from '../../kitchen/src/screens/TodoDetailView.vue'
import TodoEditorSheet from '../../kitchen/src/screens/TodoEditorSheet.vue'
import SettingsView from '../../kitchen/src/screens/SettingsView.vue'
import { todos, settings, restoreSeed, addTodo, findTodo } from '../../kitchen/src/store'

beforeEach(() => {
  history.replaceState(null, '', '/')
  restoreSeed()
  settings.hideCompleted.value = false
  settings.direction.value = 'auto'
})

describe('the app shell', () => {
  // The shell is the difference between an app and a pile of components.
  // TabView and NavigationStack are `height: 100%`, and a percentage height
  // needs a parent that has one — which `<body>` has not. Without it
  // everything collapses to content height and the tab bar lands on the
  // list. happy-dom does no layout, so this asserts the cause rather than
  // the symptom; `e2e/kitchen.spec.ts` is what sees the symptom.
  it('is wrapped in the full-screen shell', () => {
    const wrapper = mount(App, { attachTo: document.body })
    const root = wrapper.element as HTMLElement
    expect(root.classList.contains('swift-app-fullscreen'),
      'without this the tab bar sits on top of the list').toBe(true)
    expect(root.classList.contains('swift-app')).toBe(true)
    wrapper.unmount()
  })

  it('and the library actually ships that shell', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/swift.css'), 'utf8')
    const rule = css.slice(css.indexOf('.swift-app-fullscreen'))
    expect(rule.slice(0, rule.indexOf('}'))).toMatch(/position:\s*fixed/)
  })

  it('mounts, and the tab bar counts what is still open', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    // two of the three examples are not done
    expect(wrapper.find('.tab-badge').text()).toBe('2')
    expect(wrapper.text()).toContain('Todos')
    wrapper.unmount()
  })

  it('the badge follows the data rather than a snapshot of it', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    await flushPromises()

    addTodo({ title: 'Another', notes: '', priority: 'normal', due: '2026-03-01', flagged: false })
    await nextTick()

    expect(wrapper.find('.tab-badge').text()).toBe('3')
    wrapper.unmount()
  })

  // The setting has to reach a Sheet, and a Sheet is portalled to the body —
  // outside anything the app wraps around itself. Writing it on the document
  // is the only placement that works, so the placement is what is asserted.
  it('the writing direction setting lands on the document', async () => {
    const wrapper = mount(App, { attachTo: document.body })
    settings.direction.value = 'rtl'
    await nextTick()
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')

    settings.direction.value = 'auto'
    await nextTick()
    expect(document.documentElement.hasAttribute('dir'), 'auto means unset, not ltr').toBe(false)
    wrapper.unmount()
  })
})

describe('the todo list', () => {
  it('groups by whether the work is done', async () => {
    const wrapper = mount(TodosView, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('Buy milk')
    expect(wrapper.text()).toContain('Water the plants') // done, in the collapsed section
    expect(wrapper.text()).toContain('2 open · 3 total')
    wrapper.unmount()
  })

  it('hiding completed removes them and leaves the rest', async () => {
    const wrapper = mount(TodosView, { attachTo: document.body })
    settings.hideCompleted.value = true
    await nextTick()

    expect(wrapper.text()).not.toContain('Water the plants')
    expect(wrapper.text()).toContain('Buy milk')
    wrapper.unmount()
  })

  it('the checkbox toggles a todo without opening it', async () => {
    const wrapper = mount(TodosView, { attachTo: document.body })
    await flushPromises()

    const before = wrapper.findAll('[role="checkbox"]').length
    await wrapper.findAll('[role="checkbox"]')[0].trigger('click')
    await flushPromises()

    expect(todos.value.some(t => t.done && t.title !== 'Water the plants'),
      'something new is done').toBe(true)
    expect(wrapper.findAll('[role="checkbox"]').length,
      'the row was not pushed away').toBe(before)
    wrapper.unmount()
  })

  it('a swipe action deletes the row it belongs to', async () => {
    const wrapper = mount(TodosView, { attachTo: document.body })
    await flushPromises()

    // The visually-hidden buttons SwipeActions renders for keyboard users
    // are the same actions the gesture runs.
    const del = wrapper.findAll('button').find(b => b.text() === 'Delete')
    expect(del, 'swipe actions are reachable without the gesture').toBeTruthy()
    await del!.trigger('click')
    await flushPromises()

    expect(todos.value.length).toBe(2)
    wrapper.unmount()
  })
})

describe('the editor sheet', () => {
  it('will not save a todo with no title', async () => {
    const wrapper = mount(TodoEditorSheet, {
      props: { isPresented: true },
      attachTo: document.body,
    })
    await flushPromises()

    const submit = [...document.querySelectorAll('button')].find(b => b.textContent === 'Add Todo')
    submit!.click()
    await flushPromises()

    expect(todos.value.length, 'nothing was added').toBe(3)
    expect(document.body.textContent).toContain('A todo needs a title')
    wrapper.unmount()
  })

  it('saves one that has a title, and closes', async () => {
    const wrapper = mount(TodoEditorSheet, {
      props: { isPresented: true },
      attachTo: document.body,
    })
    await flushPromises()

    const field = document.querySelector('input[type="text"]') as HTMLInputElement
    field.value = 'Post the letter'
    field.dispatchEvent(new Event('input'))
    await flushPromises()

    const submit = [...document.querySelectorAll('button')].find(b => b.textContent === 'Add Todo')
    submit!.click()
    await flushPromises()

    expect(todos.value[0].title).toBe('Post the letter')
    expect(wrapper.emitted('update:isPresented')?.at(-1)).toEqual([false])
    wrapper.unmount()
  })

  // The default is a setting, so a form that read it once would show the
  // wrong priority the second time the sheet opened.
  it('picks up the default priority set since it last opened', async () => {
    const wrapper = mount(TodoEditorSheet, {
      props: { isPresented: false },
      attachTo: document.body,
    })
    settings.defaultPriority.value = 'high'
    await wrapper.setProps({ isPresented: true })
    await flushPromises()

    const field = document.querySelector('input[type="text"]') as HTMLInputElement
    field.value = 'Urgent thing'
    field.dispatchEvent(new Event('input'))
    await flushPromises()
    const submit = [...document.querySelectorAll('button')].find(b => b.textContent === 'Add Todo')
    submit!.click()
    await flushPromises()

    expect(todos.value[0].priority).toBe('high')
    settings.defaultPriority.value = 'normal'
    wrapper.unmount()
  })
})

describe('the detail screen', () => {
  it('edits the todo it was given', async () => {
    const wrapper = mount(TodoDetailView, {
      props: { id: 'seed-1' },
      attachTo: document.body,
    })
    await flushPromises()

    const [doneSwitch] = wrapper.findAll('[role="switch"]')
    await doneSwitch.trigger('click')
    await flushPromises()

    expect(findTodo('seed-1')!.done).toBe(true)
    wrapper.unmount()
  })

  it('says so when the todo is gone rather than rendering blank', async () => {
    const wrapper = mount(TodoDetailView, {
      props: { id: 'no-such-id' },
      attachTo: document.body,
    })
    await flushPromises()

    expect(wrapper.text()).toContain('This todo is gone')
    wrapper.unmount()
  })

  it('counts an appearance, once', async () => {
    const wrapper = mount(TodoDetailView, {
      props: { id: 'seed-1' },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="appear-count"]').text()).toContain('1×')
    wrapper.unmount()
  })
})

describe('settings', () => {
  it('writes through to storage, so a reload keeps the choice', async () => {
    const wrapper = mount(SettingsView, { attachTo: document.body })
    await flushPromises()

    const [hideCompleted] = wrapper.findAll('[role="switch"]')
    await hideCompleted.trigger('click')
    await flushPromises()

    expect(settings.hideCompleted.value).toBe(true)
    expect(localStorage.getItem('kitchen.hideCompleted')).toBe('true')
    wrapper.unmount()
  })

  it('reset puts the examples back', async () => {
    const wrapper = mount(SettingsView, { attachTo: document.body })
    todos.value = []
    settings.hideCompleted.value = true
    await flushPromises()

    const reset = wrapper.findAll('button').find(b => b.text() === 'Reset Everything')
    await reset!.trigger('click')
    await flushPromises()

    const confirm = [...document.querySelectorAll('button')].find(b => b.textContent === 'Reset')
    confirm!.click()
    await flushPromises()

    expect(todos.value.length).toBe(3)
    expect(settings.hideCompleted.value).toBe(false)
    wrapper.unmount()
  })
})

describe('nothing on a Kitchen screen warns', () => {
  // A Vue warning is a contract the app broke — a missing required prop, a
  // failed type, an unresolved component. They are easy to miss in a browser
  // and easy to catch here.
  it('mounting every screen is silent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    for (const screen of [TodosView, SettingsView, TodoDetailView]) {
      const wrapper = mount(screen, {
        props: screen === TodoDetailView ? { id: 'seed-1' } : {},
        attachTo: document.body,
      })
      await flushPromises()
      wrapper.unmount()
    }

    expect(warn.mock.calls.flat().join('\n')).toBe('')
    expect(error.mock.calls.flat().join('\n')).toBe('')
    warn.mockRestore()
    error.mockRestore()
  })
})
