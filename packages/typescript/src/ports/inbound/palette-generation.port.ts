/**
 * [Hexagonal Layer: Inbound Port]
 * 调色板生成与色相和谐驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models
 */

export const StandardTones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100] as const
export type StandardTone = (typeof StandardTones)[number]

export const PaletteVariants = [
  'tonalSpot',
  'vibrant',
  'expressive',
  'neutral',
  'monochrome',
  'fidelity',
] as const
export type PaletteVariant = (typeof PaletteVariants)[number]

export interface ITonalPalettePort {
  readonly hue: number
  readonly targetChroma: number
  tone(toneValue: number): string
  getAllTones(): Record<StandardTone, string>
}

export const StandardPaletteKeys = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
  'warning',
  'success',
  'info',
] as const
export type StandardPaletteKey = (typeof StandardPaletteKeys)[number]

export interface PaletteSet<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  primary: TPalette
  secondary: TPalette
  tertiary: TPalette
  neutral: TPalette
  neutralVariant: TPalette
  error: TPalette
  warning: TPalette
  success: TPalette
  info: TPalette
}

export interface IPaletteGenerationPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  createPalettesFromSource(
    sourceHex: string,
    variant?: PaletteVariant,
    harmonizeSemantics?: boolean
  ): PaletteSet<TPalette>
  harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle?: number): string
  isWarmHue(hue: number): boolean
}
