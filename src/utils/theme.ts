export const SwiftColors = {
  primary: 'var(--swift-primary)',
  secondary: 'var(--swift-secondary)',
  accent: 'var(--swift-accent)',
  red: 'var(--swift-red)',
  orange: 'var(--swift-orange)',
  yellow: 'var(--swift-yellow)',
  green: 'var(--swift-green)',
  mint: 'var(--swift-mint)',
  teal: 'var(--swift-teal)',
  cyan: 'var(--swift-cyan)',
  blue: 'var(--swift-blue)',
  indigo: 'var(--swift-indigo)',
  purple: 'var(--swift-purple)',
  pink: 'var(--swift-pink)',
  brown: 'var(--swift-brown)',
  gray: 'var(--swift-gray)',
  white: '#FFFFFF',
  black: '#000000',
  clear: 'transparent',
  label: 'var(--swift-label)',
  secondaryLabel: 'var(--swift-secondary-label)',
  tertiaryLabel: 'var(--swift-tertiary-label)',
  background: 'var(--swift-background)',
  secondaryBackground: 'var(--swift-secondary-background)',
  tertiaryBackground: 'var(--swift-tertiary-background)',
  separator: 'var(--swift-separator)',
  fill: 'var(--swift-fill)',
  secondaryFill: 'var(--swift-secondary-fill)',
} as const

export type SwiftColorName = keyof typeof SwiftColors

export const SwiftFonts = {
  largeTitle: { size: '34px', weight: '700', lineHeight: '41px' },
  title: { size: '28px', weight: '700', lineHeight: '34px' },
  title2: { size: '22px', weight: '700', lineHeight: '28px' },
  title3: { size: '20px', weight: '600', lineHeight: '25px' },
  headline: { size: '17px', weight: '600', lineHeight: '22px' },
  body: { size: '17px', weight: '400', lineHeight: '22px' },
  callout: { size: '16px', weight: '400', lineHeight: '21px' },
  subheadline: { size: '15px', weight: '400', lineHeight: '20px' },
  footnote: { size: '13px', weight: '400', lineHeight: '18px' },
  caption: { size: '12px', weight: '400', lineHeight: '16px' },
  caption2: { size: '11px', weight: '400', lineHeight: '13px' },
} as const

export type SwiftFontStyle = keyof typeof SwiftFonts

export function resolveColor(color: string): string {
  if (color in SwiftColors) return SwiftColors[color as SwiftColorName]
  return color
}

export function resolveFont(font: SwiftFontStyle) {
  return SwiftFonts[font] ?? SwiftFonts.body
}
