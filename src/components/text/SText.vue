<script setup lang="ts">
import { computed } from 'vue'
import { useModifiers, type ModifierProps } from '../../utils/modifiers'
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

const alignMap = { leading: 'left', center: 'center', trailing: 'right' }

const modifierStyle = useModifiers(props)
const style = computed(() => {
  const f = resolveFont(props.font!)
  const s: any = {
    ...modifierStyle.value,
    fontSize: f.size,
    lineHeight: f.lineHeight,
    fontWeight: props.bold ? '700' : modifierStyle.value.fontWeight ?? f.weight,
    fontStyle: props.italic ? 'italic' : undefined,
    textDecoration: [
      props.strikethrough ? 'line-through' : '',
      props.underline ? 'underline' : '',
    ].filter(Boolean).join(' ') || undefined,
    textAlign: props.multilineTextAlignment ? alignMap[props.multilineTextAlignment] : undefined,
  }
  if (props.lineLimit) {
    s.display = '-webkit-box'
    s.WebkitLineClamp = props.lineLimit
    s.WebkitBoxOrient = 'vertical'
    s.overflow = 'hidden'
  }
  return s
})
</script>

<template>
  <span :style="style"><slot /></span>
</template>
