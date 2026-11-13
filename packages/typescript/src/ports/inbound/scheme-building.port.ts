/**
 * [Hexagonal Layer: Inbound Port]
 * Dynamic MD3 token scheme solving, custom color quadruples, and contrast auditing contract.
 * Constraint: depends only on domain/models and sibling inbound ports.
 */

import type { ContrastMetric } from '../../domain/models/index.ts'
import type { PaletteSet, ITonalPalettePort } from './palette-generation.port.ts'

export const ThemeModes = ['light', 'dark'] as const
export type ThemeMode = (typeof ThemeModes)[number]

export const EmissivePanelTypes = [
  'standard-lcd',
  'oled-true-black',
  'amoled-anti-smear',
  'micro-oled-xr',
] as const
export type EmissivePanelType = (typeof EmissivePanelTypes)[number]

export interface EmissiveSchemeOptions {
  profile?: EmissivePanelType
  burnInGuard?: boolean
  antiFringing?: boolean
}

export interface BuildDynamicSchemeOptions {
  mode?: ThemeMode
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  emissive?: EmissiveSchemeOptions
}

export interface ResolveCustomColorsOptions {
  mode?: ThemeMode
  contrastLevel?: number
  contrastMetric?: ContrastMetric
}

export interface CustomColorInput {
  id?: string
  name: string
  label?: string
  sourceHex: string
  harmonize?: boolean
}

export interface CustomColorConfig extends CustomColorInput {
  id: string
  name: string
  label: string
  sourceHex: string
  harmonize: boolean
}

export interface ResolvedCustomColor {
  id: string
  name: string
  label: string
  sourceHex: string
  harmonizedHex: string
  hueShiftDeg: number
  color: string
  onColor: string
  colorContainer: string
  onColorContainer: string
  wcagRatioColor: number
  wcagRatioContainer: number
  apcaLcColor: number
  apcaLcContainer: number
}

/**
 * Single Source of Truth (SSOT) for system color tokens.
 */
export const SystemColorTokens = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',

  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',

  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',

  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',

  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',

  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',

  'info',
  'onInfo',
  'infoContainer',
  'onInfoContainer',

  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',

  'outline',
  'outlineVariant',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'inverseOnPrimary',
  'inversePrimaryContainer',
  'inverseOnPrimaryContainer',
  'scrim',
  'shadow',
] as const

export type SystemColorToken = (typeof SystemColorTokens)[number]

export type DynamicSchemeColors = {
  [K in SystemColorToken]: string
} & {
  tones: Record<SystemColorToken, number>
}

export interface ContrastAuditItem {
  fgRole: SystemColorToken
  bgRole: SystemColorToken
  fgTone: number
  bgTone: number
  wcagRatio: number
  wcagPassAA: boolean
  wcagPassAAA: boolean
  apcaLc: number
  apcaPass: boolean
}

export interface ISchemeBuildingPort<TPalette extends ITonalPalettePort = ITonalPalettePort> {
  buildDynamicScheme(
    palettes: PaletteSet<TPalette>,
    options?: BuildDynamicSchemeOptions
  ): DynamicSchemeColors

  resolveCustomColors(
    configs: readonly CustomColorInput[],
    primarySeedHex: string,
    options?: ResolveCustomColorsOptions
  ): ResolvedCustomColor[]

  auditSchemeContrast(scheme: DynamicSchemeColors): ContrastAuditItem[]
}
