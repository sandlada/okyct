/**
 * [Hexagonal Layer: Inbound Port]
 * Dynamic MD3 token scheme solving, custom color quadruples, and contrast auditing contract.
 * Constraint: depends only on domain/models and sibling inbound ports.
 */

import type { ContrastMetric, CvdType } from '../../domain/models/index.ts'
import type { PaletteSet, ITonalPalettePort } from './palette-generation.port.ts'

export const ThemeModes = ['light', 'dark'] as const
export type ThemeMode = (typeof ThemeModes)[number]

export const AmbientSurrounds = ['bright', 'normal', 'darkroom'] as const
export type AmbientSurround = (typeof AmbientSurrounds)[number]

export const EmissivePanelTypes = [
  'standard-lcd',
  'oled-true-black',
  'amoled-anti-smear',
  'micro-oled-xr',
  'woled-desktop',
] as const
export type EmissivePanelType = (typeof EmissivePanelTypes)[number]

export const StateLayerStates = ['hovered', 'focused', 'pressed', 'dragged'] as const
export type StateLayerState = (typeof StateLayerStates)[number]

export type StateLayersOption = boolean | readonly StateLayerState[]
export type StateLayerBlendSpace = 'okyct' | 'gamma-srgb' | 'linear-srgb'

export interface EmissiveSchemeOptions {
  profile?: EmissivePanelType
  burnInGuard?: boolean
  antiFringing?: boolean
  ablGuard?: boolean
}

export interface BuildDynamicSchemeOptions {
  mode?: ThemeMode
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  ambient?: AmbientSurround
  emissive?: EmissiveSchemeOptions
  stateLayers?: StateLayersOption
  stateLayersBlendSpace?: StateLayerBlendSpace
  stateLayersContrastGuard?: boolean
}

export interface ResolveCustomColorsOptions {
  mode?: ThemeMode
  contrastLevel?: number
  contrastMetric?: ContrastMetric
  stateLayers?: StateLayersOption
  stateLayersBlendSpace?: StateLayerBlendSpace
  stateLayersContrastGuard?: boolean
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
  stateLayers?: Record<string, string>
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

/**
 * Single Source of Truth (SSOT) for background/container/surface system tokens
 * that support pre-composited state layers.
 */
export const StatefulSystemColorTokens = [
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

  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'inverseOnPrimary',
  'inversePrimaryContainer',
  'inverseOnPrimaryContainer',
] as const

export type StatefulSystemColorToken = (typeof StatefulSystemColorTokens)[number]

export type SystemStateLayerToken<
  TToken extends StatefulSystemColorToken = StatefulSystemColorToken,
  TState extends StateLayerState = StateLayerState,
> = `${TToken}${Capitalize<TState>}`

export type SchemeStateLayerTokens = Partial<Record<SystemStateLayerToken, string>>

export type DynamicSchemeColors = {
  [K in SystemColorToken]: string
} & Partial<Record<SystemStateLayerToken, string>> & {
  tones: Record<SystemColorToken, number>
  stateLayers?: SchemeStateLayerTokens
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

export interface CvdSeparabilityAuditItem {
  roleA: SystemColorToken
  roleB: SystemColorToken
  cvdType: Exclude<CvdType, 'none'>
  deltaEOklab: number
  deltaTone: number
  separable: boolean
  recommendation: string
}

export interface AuditSchemeCvdOptions {
  cvdTypes?: readonly Exclude<CvdType, 'none'>[]
  severity?: number
  minDeltaE?: number
  minDeltaTone?: number
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
