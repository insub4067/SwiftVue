<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, composeStyle, type ModifierProps } from '../../utils/modifiers'
import { resolveFont, type SwiftFontStyle } from '../../utils/theme'

interface Props extends ModifierProps {
  font?: SwiftFontStyle
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  underline?: boolean
  lineLimit?: number
  multilineTextAlignment?: 'leading' | 'center' | 'trailing'
}

const props = withDefaults(defineProps<Props>(), {
  font: 'body',
})

// start/end rather than left/right: leading and trailing follow the
// writing direction, which is the whole point of naming them that way.
const alignMap = { leading: 'start', center: 'center', trailing: 'end' }

const modifierStyle = useModifiers(props)
const style = computed(() => {
  const f = resolveFont(props.font!)
  const own: any = {
    fontSize: f.size,
    lineHeight: f.lineHeight,
    fontWeight: f.weight,
    fontStyle: props.italic ? 'italic' : undefined,
    textDecoration: [
      props.strikethrough ? 'line-through' : '',
      props.underline ? 'underline' : '',
    ].filter(Boolean).join(' ') || undefined,
    textAlign: props.multilineTextAlignment ? alignMap[props.multilineTextAlignment] : undefined,
  }
  if (props.lineLimit) {
    own.display = '-webkit-box'
    own.WebkitLineClamp = props.lineLimit
    own.WebkitBoxOrient = 'vertical'
    own.overflow = 'hidden'
  }
  // `bold` is the dedicated prop, so it has the last word over fontWeight
  return composeStyle(modifierStyle.value, own, props.bold ? { fontWeight: '700' } : {})
})
</script>

<template>
  <span :style="style"><slot /></span>
</template>
