/**
 * 基准语义 token 表（角色 Tone 目标 + 共同字/底对）
 * Tone 与 OKYCT buildDynamicSchemeWithPhysics（contrastLevel=0，standard-lcd）一致
 */

export const SemanticContrastRoleTokens = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
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
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'inverseSurface',
  'inverseOnSurface',
] as const

export type SemanticContrastRoleToken = (typeof SemanticContrastRoleTokens)[number]

export const SemanticContrastRolePairs = [
  { fg: 'onPrimary', bg: 'primary' },
  { fg: 'onPrimaryContainer', bg: 'primaryContainer' },
  { fg: 'onSecondary', bg: 'secondary' },
  { fg: 'onSecondaryContainer', bg: 'secondaryContainer' },
  { fg: 'onTertiary', bg: 'tertiary' },
  { fg: 'onTertiaryContainer', bg: 'tertiaryContainer' },
  { fg: 'onError', bg: 'error' },
  { fg: 'onErrorContainer', bg: 'errorContainer' },
  { fg: 'onSurface', bg: 'surface' },
  { fg: 'onSurfaceVariant', bg: 'surfaceVariant' },
  { fg: 'inverseOnSurface', bg: 'inverseSurface' },
] as const satisfies ReadonlyArray<{
  fg: SemanticContrastRoleToken
  bg: SemanticContrastRoleToken
}>

export const SemanticContrastPairCount = SemanticContrastRolePairs.length

export type BenchmarkPaletteSlot =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'neutralVariant'
  | 'error'

export const SemanticRolePaletteBinding: Record<
  SemanticContrastRoleToken,
  BenchmarkPaletteSlot
> = {
  primary: 'primary',
  onPrimary: 'primary',
  primaryContainer: 'primary',
  onPrimaryContainer: 'primary',
  secondary: 'secondary',
  onSecondary: 'secondary',
  secondaryContainer: 'secondary',
  onSecondaryContainer: 'secondary',
  tertiary: 'tertiary',
  onTertiary: 'tertiary',
  tertiaryContainer: 'tertiary',
  onTertiaryContainer: 'tertiary',
  error: 'error',
  onError: 'error',
  errorContainer: 'error',
  onErrorContainer: 'error',
  surface: 'neutral',
  onSurface: 'neutral',
  surfaceVariant: 'neutralVariant',
  onSurfaceVariant: 'neutralVariant',
  inverseSurface: 'neutral',
  inverseOnSurface: 'neutral',
}

/** 浅色主题角色 Tone 目标（standard-lcd，contrastLevel=0） */
export const LightSemanticRoleToneTargets: Record<SemanticContrastRoleToken, number> = {
  primary: 40,
  onPrimary: 100,
  primaryContainer: 90,
  onPrimaryContainer: 10,
  secondary: 40,
  onSecondary: 100,
  secondaryContainer: 90,
  onSecondaryContainer: 10,
  tertiary: 40,
  onTertiary: 100,
  tertiaryContainer: 90,
  onTertiaryContainer: 10,
  error: 40,
  onError: 100,
  errorContainer: 90,
  onErrorContainer: 10,
  surface: 98,
  onSurface: 10,
  surfaceVariant: 86,
  onSurfaceVariant: 30,
  inverseSurface: 20,
  inverseOnSurface: 95,
}

/** 深色主题角色 Tone 目标（standard-lcd 暗色表面阶梯） */
export const DarkSemanticRoleToneTargets: Record<SemanticContrastRoleToken, number> = {
  primary: 80,
  onPrimary: 20,
  primaryContainer: 30,
  onPrimaryContainer: 90,
  secondary: 80,
  onSecondary: 20,
  secondaryContainer: 30,
  onSecondaryContainer: 90,
  tertiary: 80,
  onTertiary: 20,
  tertiaryContainer: 30,
  onTertiaryContainer: 90,
  error: 80,
  onError: 20,
  errorContainer: 30,
  onErrorContainer: 90,
  surface: 6,
  onSurface: 90,
  surfaceVariant: 30,
  onSurfaceVariant: 80,
  inverseSurface: 90,
  inverseOnSurface: 20,
}

export type SemanticRoleHexMap = Record<SemanticContrastRoleToken, string>
