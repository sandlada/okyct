/**
 * [Hexagonal Layer: Inbound Port]
 * Palette generation and hue harmonization driver contract.
 * Constraint: depends only on domain/models.
 */

import type { CssColorFormat, GamutTarget, OKYCT } from '../../domain/models/index.ts'

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

export interface TonalPaletteOptions {
  gamut?: GamutTarget
  hkCompensation?: boolean
  softKnee?: boolean
  maxCacheSize?: number
}

export interface CreatePalettesOptions extends TonalPaletteOptions {
  variant?: PaletteVariant
  harmonizeSemantics?: boolean
}

export interface ITonalPalettePort {
  readonly hue: number
  readonly targetChroma: number
  readonly gamut: GamutTarget
  tone(toneValue: number): string
  toneOkyct(toneValue: number, options?: { gamut?: GamutTarget }): OKYCT
  toneCss(toneValue: number, format?: CssColorFormat): string
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
    options?: CreatePalettesOptions
  ): PaletteSet<TPalette>
  harmonizeHex(designHex: string, sourceHex: string, maxShiftAngle?: number): string
  isWarmHue(hue: number): boolean
}
