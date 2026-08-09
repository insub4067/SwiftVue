import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref, effectScope } from 'vue'
import List from '../../src/components/data/SVList.vue'
import Label from '../../src/components/text/SVLabel.vue'
import ProgressView from '../../src/components/feedback/ProgressView.vue'
import Sheet from '../../src/components/navigation/Sheet.vue'
import Alert from '../../src/components/feedback/SVAlert.vue'
import { useAppStorage } from '../../src/composables/useAppStorage'

describe('List row keys', () => {
  const rows = () => ({ default: '<span class="row" />' })

  it('keys by position when no keyPath is given', () => {
    const wrapper = mount(List, { props: { items: [{ id: 'a' }, { id: 'b' }] }, slots: rows() })
    expect(wrapper.findAll('.swift-list-row')).toHaveLength(2)
  })

  // Reordering must carry a row's DOM with its item, not leave it in place.
  it('keyPath keeps a row bound to its item across a reorder', async () => {
    const items = ref([{ id: 'a' }, { id: 'b' }])
    const wrapper = mount(List, {
      props: { items: items.value, keyPath: 'id' as const },
      slots: { default: '<input class="row" />' },
    })
    const [first, second] = wrapper.findAll('input').map(w => w.element as HTMLInputElement)
    first.value = 'typed-into-a'

    await wrapper.setProps({ items: [items.value[1], items.value[0]] })

    const after = wrapper.findAll('input').map(w => w.element)
    expect(after[0], 'item b keeps its own element').toBe(second)
    expect(after[1], 'item a keeps its own element').toBe(first)
    expect((after[1] as HTMLInputElement).value).toBe('typed-into-a')
  })

  it('falls back to the index when the key field is missing', () => {
    const wrapper = mount(List, {
      props: { items: [{}, {}] as Array<{ id?: string }>, keyPath: 'id' as const },
      slots: rows(),
    })
    expect(wrapper.findAll('.swift-list-row')).toHaveLength(2)
  })
})

describe('Label semantics', () => {
  it('is a span by default — it labels nothing', () => {
    const wrapper = mount(Label, { props: { systemImage: '📁' }, slots: { default: 'Docs' } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.text()).toContain('Docs')
  })

  it('becomes a real label when bound to a control', () => {
    const wrapper = mount(Label, { props: { for: 'email' }, slots: { default: 'Email' } })
    expect(wrapper.element.tagName).toBe('LABEL')
    expect(wrapper.attributes('for')).toBe('email')
  })

  it('hides the decorative icon from assistive tech', () => {
    const wrapper = mount(Label, { props: { systemImage: '📁' }, slots: { default: 'Docs' } })
    expect(wrapper.find('span[aria-hidden="true"]').text()).toBe('📁')
  })
})

describe('ProgressView range', () => {
  const pct = (props: Record<string, unknown>) =>
    mount(ProgressView, { props: { progressViewStyle: 'linear', ...props } })
      .find('.bar').attributes('style')

  it('clamps a value above total', () => {
    expect(pct({ value: 150, total: 100 })).toContain('width: 100%')
  })

  it('clamps a negative value to zero', () => {
    expect(pct({ value: -20, total: 100 })).toContain('width: 0%')
  })

  it('treats a non-positive total as no progress', () => {
    expect(pct({ value: 50, total: 0 })).toContain('width: 0%')
    expect(pct({ value: 50, total: -10 })).toContain('width: 0%')
  })

  it('reports the clamped value to assistive tech', () => {
    const wrapper = mount(ProgressView, { props: { value: 150, total: 100 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('100')
  })
})

describe('overlay lifecycle', () => {
  it('a sheet mounted open locks scrolling and traps focus immediately', async () => {
    document.body.style.overflow = ''
    const wrapper = mount(Sheet, {
      props: { isPresented: true },
      slots: { default: '<button id="inner">Inner</button>' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('restores whatever overflow the page already had', async () => {
    document.body.style.overflow = 'clip'
    const wrapper = mount(Sheet, { props: { isPresented: true }, attachTo: document.body })
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ isPresented: false })
    expect(document.body.style.overflow, 'the page keeps its own value').toBe('clip')
    wrapper.unmount()
    document.body.style.overflow = ''
  })

  it('an alert mounted open takes focus without waiting for a change', async () => {
    const wrapper = mount(Alert, {
      props: { isPresented: true, title: 'Heads up' },
      attachTo: document.body,
    })
    await nextTick()
    await nextTick()
    expect(document.activeElement?.tagName).toBe('BUTTON')
    wrapper.unmount()
  })
})

describe('useAppStorage sharing', () => {
  it('refs on the same key stay in step', async () => {
    const a = useAppStorage('shared-key', 'initial')
    const b = useAppStorage('shared-key', 'initial')
    a.value = 'written'
    await nextTick()
    expect(b.value).toBe('written')
  })

  it('a write from another tab reaches every bound ref', async () => {
    const state = useAppStorage('tab-key', 'initial')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tab-key',
      newValue: JSON.stringify('from-other-tab'),
    }))
    await nextTick()
    expect(state.value).toBe('from-other-tab')
  })

  it('ignores an unreadable value from another tab', async () => {
    const state = useAppStorage('garbage-key', 'initial')
    window.dispatchEvent(new StorageEvent('storage', { key: 'garbage-key', newValue: '{oops' }))
    await nextTick()
    expect(state.value).toBe('initial')
  })

  it('unbinds when its scope is disposed', async () => {
    const outer = useAppStorage('scoped-key', 'initial')
    const scope = effectScope()
    let inner!: ReturnType<typeof useAppStorage<string>>
    scope.run(() => { inner = useAppStorage('scoped-key', 'initial') })
    scope.stop()

    const spy = vi.spyOn(inner, 'value', 'set')
    outer.value = 'after-dispose'
    await nextTick()
    expect(spy).not.toHaveBeenCalled()
  })
})
