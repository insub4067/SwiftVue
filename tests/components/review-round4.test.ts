import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import NavigationStack from '../../src/components/navigation/NavigationStack.vue'
import NavigationLink from '../../src/components/navigation/NavigationLink.vue'
import { useAppStorage } from '../../src/composables/useAppStorage'

/** A screen that remembers something, so reuse of its instance is visible. */
const Screen = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props) {
    const typed = ref('')
    return () => h('div', [
      h('span', { class: 'label' }, props.label),
      h('input', { class: 'field', value: typed.value, onInput: (e: Event) => (typed.value = (e.target as HTMLInputElement).value) }),
    ])
  },
})

describe('a screen keeps its own identity', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  // Keying panes by array position means two different screens that happen
  // to land at the same depth share a key. Vue patches rather than remounts,
  // so the second screen inherits the first one's state.
  it('a different screen at the same depth is a different instance', async () => {
    const wrapper = mount(NavigationStack, { props: { title: 'Home' } })

    wrapper.vm.push({ title: 'A', content: () => h(Screen, { label: 'A' }) })
    await flushPromises()
    const field = wrapper.find('.field').element as HTMLInputElement
    field.value = 'typed into A'
    await wrapper.find('.field').trigger('input')

    wrapper.vm.pop()
    await flushPromises()
    wrapper.vm.push({ title: 'B', content: () => h(Screen, { label: 'B' }) })
    await flushPromises()

    expect(wrapper.find('.label').text(), 'B is showing').toBe('B')
    expect((wrapper.find('.field').element as HTMLInputElement).value,
      'B starts empty — it never had anything typed into it').toBe('')
  })

  // The reproduction that mattered. A registry hands back the same closure
  // every time, so `:is` cannot tell the screens apart either — and a
  // replacement inside one render cycle never gives Vue a chance to unmount.
  it('a replacement made within one render is still a new screen', async () => {
    const shared = () => h(Screen, { label: 'shared' })
    const wrapper = mount(NavigationStack, { props: { title: 'Home' } })

    wrapper.vm.push({ title: 'X', content: shared })
    await flushPromises()
    const field = wrapper.find('.field').element as HTMLInputElement
    field.value = 'typed into X'
    await wrapper.find('.field').trigger('input')

    wrapper.vm.pop()
    wrapper.vm.push({ title: 'Y', content: shared })   // no render in between
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe('Y')
    expect((wrapper.find('.field').element as HTMLInputElement).value,
      'Y is a different screen, however alike it looks').toBe('')
  })

  it('and popping back to a kept screen still restores it', async () => {
    const wrapper = mount(NavigationStack, {
      props: { title: 'Home' },
      slots: { default: () => h(Screen, { label: 'root' }) },
    })

    const root = wrapper.find('.field').element as HTMLInputElement
    root.value = 'typed at the root'
    await wrapper.find('.field').trigger('input')

    wrapper.vm.push({ title: 'A', content: () => h(Screen, { label: 'A' }) })
    await flushPromises()
    wrapper.vm.pop()
    await flushPromises()

    expect((wrapper.find('.field').element as HTMLInputElement).value).toBe('typed at the root')
  })
})

describe('a link that changes what it points at', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  const Reactive = defineComponent({
    setup() {
      const route = ref('first')
      return { route }
    },
    render() {
      return h(NavigationStack, { title: 'Home', browserBack: true, historyKey: 'nav' }, {
        default: () => h(NavigationLink, { route: this.route, destinationTitle: this.route }, {
          default: () => this.route,
          destination: () => h('p', `screen-${this.route}`),
        }),
      })
    },
  })

  it('registers under the new name and forgets the old one', async () => {
    const wrapper = mount(Reactive, { attachTo: document.body })
    await flushPromises()

    wrapper.vm.route = 'second'
    await flushPromises()

    const stack = wrapper.findComponent(NavigationStack)
    stack.vm.pushRoute('first')
    await flushPromises()
    expect(stack.vm.depth, 'the old name is gone').toBe(0)

    stack.vm.pushRoute('second')
    await flushPromises()
    expect(stack.vm.depth, 'the new one works').toBe(1)
    expect(wrapper.text()).toContain('screen-second')
    wrapper.unmount()
  })

  it('and clicking it pushes what it points at now', async () => {
    const wrapper = mount(Reactive, { attachTo: document.body })
    await flushPromises()
    wrapper.vm.route = 'second'
    await flushPromises()

    await wrapper.find('.nav-link').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('screen-second')
    wrapper.unmount()
  })
})

describe('browserBack answers to its prop', () => {
  beforeEach(() => history.replaceState(null, '', '/'))

  it('turning it on later claims history', async () => {
    const wrapper = mount(NavigationStack, { props: { title: 'Home', browserBack: false } })
    const push = vi.spyOn(history, 'pushState')

    wrapper.vm.push({ title: 'A', content: () => h('p', 'a') })
    await flushPromises()
    expect(push, 'off, so nothing recorded').not.toHaveBeenCalled()

    await wrapper.setProps({ browserBack: true })
    wrapper.vm.push({ title: 'B', content: () => h('p', 'b') })
    await flushPromises()
    expect(push, 'on now').toHaveBeenCalled()

    push.mockRestore()
    wrapper.unmount()
  })

  it('turning it off releases the seat for another stack', async () => {
    const first = mount(NavigationStack, { props: { title: 'A', browserBack: true } })
    await flushPromises()
    await first.setProps({ browserBack: false })

    const push = vi.spyOn(history, 'pushState')
    const second = mount(NavigationStack, { props: { title: 'B', browserBack: true } })
    second.vm.push({ title: 'X', content: () => h('p', 'x') })
    await flushPromises()

    expect(push, 'the seat was free').toHaveBeenCalled()
    push.mockRestore()
    first.unmount()
    second.unmount()
  })
})

describe('useAppStorage follows another tab that clears', () => {
  const fire = (init: StorageEventInit) =>
    window.dispatchEvent(new StorageEvent('storage', init))

  it('a removed key falls back to the default', async () => {
    const state = useAppStorage('removed-key', 'default')
    state.value = 'written'
    await nextTick()

    fire({ key: 'removed-key', newValue: null })
    await nextTick()
    expect(state.value).toBe('default')
  })

  // localStorage.clear() reports key: null, meaning "all of them".
  it('a cleared storage resets every bound ref', async () => {
    const a = useAppStorage('cleared-a', 'default-a')
    const b = useAppStorage('cleared-b', 'default-b')
    a.value = 'written-a'
    b.value = 'written-b'
    await nextTick()

    fire({ key: null, newValue: null })
    await nextTick()
    expect(a.value).toBe('default-a')
    expect(b.value).toBe('default-b')
  })

  it('a write from another tab still wins over the default', async () => {
    const state = useAppStorage('written-key', 'default')
    fire({ key: 'written-key', newValue: JSON.stringify('from the other tab') })
    await nextTick()
    expect(state.value).toBe('from the other tab')
  })
})
