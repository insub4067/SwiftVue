import { computed, type CSSProperties } from 'vue'
import { resolveColor, resolveFont, type SwiftFontStyle } from './theme'

export interface FrameModifier {
  width?: string | number
  height?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  minHeight?: string | number
  maxHeight?: string | number
  alignment?: 'leading' | 'center' | 'trailing' | 'top' | 'bottom' | 'topLeading' | 'topTrailing' | 'bottomLeading' | 'bottomTrailing'
}

export interface ShadowModifier {
  color?: string
  radius: number
  x?: number
  y?: number
}

export interface ModifierProps {
  padding?: number | [number, number] | [number, number, number, number]
  paddingHorizontal?: number
  paddingVertical?: number
  frame?: FrameModifier
  background?: string
  foregroundColor?: string
  font?: SwiftFontStyle
  fontWeight?: 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  cornerRadius?: number
  shadow?: ShadowModifier
  opacity?: number
  border?: { color?: string; width?: number }
  zIndex?: number
  hidden?: boolean
  clipShape?: 'circle' | 'capsule' | 'roundedRectangle'
}

const fontWeightMap: Record<string, string> = {
  ultraLight: '100', thin: '200', light: '300', regular: '400',
  medium: '500', semibold: '600', bold: '700', heavy: '800', black: '900',
}

const alignmentMap: Record<string, { justifyContent?: string; alignItems?: string }> = {
  leading: { alignItems: 'flex-start' },
  center: { alignItems: 'center', justifyContent: 'center' },
  trailing: { alignItems: 'flex-end' },
  top: { justifyContent: 'flex-start' },
  bottom: { justifyContent: 'flex-end' },
  topLeading: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  topTrailing: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  bottomLeading: { justifyContent: 'flex-end', alignItems: 'flex-start' },
  bottomTrailing: { justifyContent: 'flex-end', alignItems: 'flex-end' },
}

function toPx(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

export function buildModifierStyle(props: ModifierProps): CSSProperties {
  const style: CSSProperties = {}

  if (props.padding != null) {
    if (typeof props.padding === 'number') {
      style.padding = `${props.padding}px`
    } else if (Array.isArray(props.padding)) {
      style.padding = props.padding.length === 2
        ? `${props.padding[0]}px ${props.padding[1]}px`
        : `${props.padding[0]}px ${props.padding[1]}px ${props.padding[2]}px ${props.padding[3]}px`
    }
  }
  if (props.paddingHorizontal != null) {
    style.paddingLeft = `${props.paddingHorizontal}px`
    style.paddingRight = `${props.paddingHorizontal}px`
  }
  if (props.paddingVertical != null) {
    style.paddingTop = `${props.paddingVertical}px`
    style.paddingBottom = `${props.paddingVertical}px`
  }

  if (props.frame) {
    const f = props.frame
    if (f.width != null) style.width = toPx(f.width)
    if (f.height != null) style.height = toPx(f.height)
    if (f.minWidth != null) style.minWidth = toPx(f.minWidth)
    if (f.maxWidth != null) style.maxWidth = toPx(f.maxWidth)
    if (f.minHeight != null) style.minHeight = toPx(f.minHeight)
    if (f.maxHeight != null) style.maxHeight = toPx(f.maxHeight)
    if (f.alignment && alignmentMap[f.alignment]) {
      Object.assign(style, alignmentMap[f.alignment])
    }
  }

  if (props.background) {
    style.backgroundColor = resolveColor(props.background)
  }

  if (props.foregroundColor) {
    style.color = resolveColor(props.foregroundColor)
  }

  if (props.font) {
    const f = resolveFont(props.font)
    style.fontSize = f.size
    style.lineHeight = f.lineHeight
    if (!props.fontWeight) style.fontWeight = f.weight
  }

  if (props.fontWeight) {
    style.fontWeight = fontWeightMap[props.fontWeight] ?? '400'
  }

  if (props.cornerRadius != null) {
    style.borderRadius = `${props.cornerRadius}px`
  }

  if (props.shadow) {
    const s = props.shadow
    const sc = s.color ? resolveColor(s.color) : 'rgba(0,0,0,0.15)'
    style.boxShadow = `${s.x ?? 0}px ${s.y ?? 2}px ${s.radius * 2}px ${sc}`
  }

  if (props.opacity != null) {
    style.opacity = props.opacity
  }

  if (props.border) {
    style.border = `${props.border.width ?? 1}px solid ${resolveColor(props.border.color ?? 'separator')}`
  }

  if (props.zIndex != null) {
    style.zIndex = props.zIndex
  }

  if (props.hidden) {
    style.display = 'none'
  }

  if (props.clipShape) {
    if (props.clipShape === 'circle') style.borderRadius = '50%'
    else if (props.clipShape === 'capsule') style.borderRadius = '9999px'
  }

  return style
}

export function useModifiers(props: ModifierProps) {
  return computed(() => buildModifierStyle(props))
}

export const modifierPropDefs = {
  padding: { type: [Number, Array] as any, default: undefined },
  paddingHorizontal: { type: Number, default: undefined },
  paddingVertical: { type: Number, default: undefined },
  frame: { type: Object, default: undefined },
  background: { type: String, default: undefined },
  foregroundColor: { type: String, default: undefined },
  font: { type: String, default: undefined },
  fontWeight: { type: String, default: undefined },
  cornerRadius: { type: Number, default: undefined },
  shadow: { type: Object, default: undefined },
  opacity: { type: Number, default: undefined },
  border: { type: Object, default: undefined },
  zIndex: { type: Number, default: undefined },
  hidden: { type: Boolean, default: undefined },
  clipShape: { type: String, default: undefined },
} as const
