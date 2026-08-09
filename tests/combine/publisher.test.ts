import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, effectScope } from 'vue'
import { publisher } from '../../src/combine/publisher'

// Fake only what these tests use. The default set also fakes setImmediate
// and friends, which Node 18's test-runner internals depend on — restoring
// real timers then deadlocks and every hook times out.
beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }))
afterEach(() => vi.useRealTimers())

async function tick() {
  await nextTick()
}

describe('publisher', () => {
  it('sink receives source changes', async () => {
    const source = ref(0)
    const spy = vi.fn()
    publisher(source).sink(spy)

    source.value = 1
    await tick()
    expect(spy).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('map transforms values', async () => {
    const source = ref('a')
    const spy = vi.fn()
    publisher(source).map(s => s.toUpperCase()).sink(spy)

    source.value = 'hello'
    await tick()
    expect(spy).toHaveBeenCalledWith('HELLO')
  })

  it('filter drops values', async () => {
    const source = ref(0)
    const spy = vi.fn()
    publisher(source).filter(n => n % 2 === 0).sink(spy)

    source.value = 1
    await tick()
    source.value = 2
    await tick()
    expect(spy).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('removeDuplicates skips repeats of the delivered value', async () => {
    const source = ref('')
    const spy = vi.fn()
    // map first so duplicates are judged on the transformed value
    publisher(source).map(s => s.trim()).removeDuplicates().sink(spy)

    source.value = 'swift'
    await tick()
    source.value = ' swift ' // same after trim
    await tick()
    source.value = 'vue'
    await tick()
    expect(spy.mock.calls.map(c => c[0])).toEqual(['swift', 'vue'])
  })

  it('debounce delivers only after quiet time', async () => {
    const source = ref('')
    const spy = vi.fn()
    publisher(source).debounce(300).sink(spy)

    source.value = 's'
    await tick()
    source.value = 'sw'
    await tick()
    vi.advanceTimersByTime(200)
    expect(spy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(150)
    expect(spy).toHaveBeenCalledExactlyOnceWith('sw')
  })

  it('throttle delivers at most once per interval, leading edge', async () => {
    vi.setSystemTime(0)
    const source = ref(0)
    const spy = vi.fn()
    publisher(source).throttle(1000).sink(spy)

    source.value = 1
    await tick()
    source.value = 2
    await tick()
    expect(spy).toHaveBeenCalledExactlyOnceWith(1)

    vi.setSystemTime(1500)
    source.value = 3
    await tick()
    expect(spy).toHaveBeenLastCalledWith(3)
  })

  it('a full pipeline composes in order', async () => {
    const source = ref('')
    const spy = vi.fn()
    publisher(source)
      .map(s => s.trim())
      .filter(s => s.length >= 2)
      .removeDuplicates()
      .debounce(300)
      .sink(spy)

    source.value = ' a '   // filtered: too short
    await tick()
    source.value = ' ab '  // survives
    await tick()
    vi.advanceTimersByTime(350)
    expect(spy).toHaveBeenCalledExactlyOnceWith('ab')
  })

  it('the stop handle ends delivery and clears pending timers', async () => {
    const source = ref('')
    const spy = vi.fn()
    const stop = publisher(source).debounce(300).sink(spy)

    source.value = 'pending'
    await tick()
    stop()
    vi.advanceTimersByTime(1000)
    expect(spy).not.toHaveBeenCalled()

    source.value = 'after-stop'
    await tick()
    vi.advanceTimersByTime(1000)
    expect(spy).not.toHaveBeenCalled()
  })

  it('operators are independent per subscription', async () => {
    const source = ref(0)
    const base = publisher(source).removeDuplicates()
    const a = vi.fn()
    const b = vi.fn()
    base.sink(a)
    base.sink(b)

    source.value = 1
    await tick()
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
  })
})

describe('scope-bound cleanup', () => {
  it('a pending debounce does not fire after the owning scope is disposed', async () => {
    const source = ref('')
    const spy = vi.fn()
    const scope = effectScope()
    scope.run(() => { publisher(source).debounce(300).sink(spy) })

    source.value = 'typed'
    await tick()
    scope.stop() // the component unmounts with a timer still queued

    vi.advanceTimersByTime(1000)
    expect(spy).not.toHaveBeenCalled()
  })

  it('stopping manually inside a scope stays safe when the scope disposes too', async () => {
    const source = ref('')
    const spy = vi.fn()
    const scope = effectScope()
    let stop!: () => void
    scope.run(() => { stop = publisher(source).debounce(300).sink(spy) })

    source.value = 'typed'
    await tick()
    stop()
    expect(() => scope.stop()).not.toThrow()

    vi.advanceTimersByTime(1000)
    expect(spy).not.toHaveBeenCalled()
  })

  it('works outside any scope, where there is nothing to bind to', async () => {
    const source = ref(0)
    const spy = vi.fn()
    const stop = publisher(source).sink(spy)
    source.value = 1
    await tick()
    expect(spy).toHaveBeenCalledOnce()
    stop()
  })
})
