import { defineComponent, toRef } from 'vue'
import { provideViewVisibility } from '../../composables/useLifecycle'

/**
 * Renders a pane's content and tells it whether it is the pane on screen.
 * A component, not a `provide` in NavigationStack's own setup, because each
 * pane needs its own value and `provide` is per instance.
 *
 * It adds no element of its own — the pane's box belongs to NavigationStack.
 */
export default defineComponent({
  name: 'NavPane',
  props: {
    active: { type: Boolean, required: true },
  },
  setup(props, { slots }) {
    provideViewVisibility(toRef(props, 'active'))
    return () => slots.default?.()
  },
})
