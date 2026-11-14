import type { SystemColorToken } from '../../color/scheme.ts'

export type TokenCategory =
  | 'all'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'status'
  | 'surface'
  | 'inverse-utility'
  | 'custom'

export interface TokenMeta {
  token: SystemColorToken
  label: string
  category: TokenCategory
  pairedRole?: SystemColorToken
}

export const TokenCategories = [
  { id: 'all', label: 'All' },
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
  { id: 'tertiary', label: 'Tertiary' },
  { id: 'status', label: 'Status' },
  { id: 'surface', label: 'Surface' },
  { id: 'inverse-utility', label: 'Inverse & utility' },
  { id: 'custom', label: 'Custom' },
] as const

export const SystemTokenDefinitions: TokenMeta[] = [
  // Primary
  { token: 'primary', label: 'Primary', category: 'primary', pairedRole: 'onPrimary' },
  { token: 'onPrimary', label: 'On primary', category: 'primary', pairedRole: 'primary' },
  { token: 'primaryContainer', label: 'Primary container', category: 'primary', pairedRole: 'onPrimaryContainer' },
  { token: 'onPrimaryContainer', label: 'On primary container', category: 'primary', pairedRole: 'primaryContainer' },
  { token: 'primaryFixed', label: 'Primary fixed', category: 'primary', pairedRole: 'onPrimaryFixed' },
  { token: 'primaryFixedDim', label: 'Primary fixed dim', category: 'primary', pairedRole: 'onPrimaryFixed' },
  { token: 'onPrimaryFixed', label: 'On primary fixed', category: 'primary', pairedRole: 'primaryFixed' },
  { token: 'onPrimaryFixedVariant', label: 'On primary fixed variant', category: 'primary', pairedRole: 'primaryFixedDim' },

  // Secondary
  { token: 'secondary', label: 'Secondary', category: 'secondary', pairedRole: 'onSecondary' },
  { token: 'onSecondary', label: 'On secondary', category: 'secondary', pairedRole: 'secondary' },
  { token: 'secondaryContainer', label: 'Secondary container', category: 'secondary', pairedRole: 'onSecondaryContainer' },
  { token: 'onSecondaryContainer', label: 'On secondary container', category: 'secondary', pairedRole: 'secondaryContainer' },

  // Tertiary
  { token: 'tertiary', label: 'Tertiary', category: 'tertiary', pairedRole: 'onTertiary' },
  { token: 'onTertiary', label: 'On tertiary', category: 'tertiary', pairedRole: 'tertiary' },
  { token: 'tertiaryContainer', label: 'Tertiary container', category: 'tertiary', pairedRole: 'onTertiaryContainer' },
  { token: 'onTertiaryContainer', label: 'On tertiary container', category: 'tertiary', pairedRole: 'tertiaryContainer' },

  // Status (Error / Warning / Success / Info)
  { token: 'error', label: 'Error', category: 'status', pairedRole: 'onError' },
  { token: 'onError', label: 'On error', category: 'status', pairedRole: 'error' },
  { token: 'errorContainer', label: 'Error container', category: 'status', pairedRole: 'onErrorContainer' },
  { token: 'onErrorContainer', label: 'On error container', category: 'status', pairedRole: 'errorContainer' },

  { token: 'warning', label: 'Warning', category: 'status', pairedRole: 'onWarning' },
  { token: 'onWarning', label: 'On warning', category: 'status', pairedRole: 'warning' },
  { token: 'warningContainer', label: 'Warning container', category: 'status', pairedRole: 'onWarningContainer' },
  { token: 'onWarningContainer', label: 'On warning container', category: 'status', pairedRole: 'warningContainer' },

  { token: 'success', label: 'Success', category: 'status', pairedRole: 'onSuccess' },
  { token: 'onSuccess', label: 'On success', category: 'status', pairedRole: 'success' },
  { token: 'successContainer', label: 'Success container', category: 'status', pairedRole: 'onSuccessContainer' },
  { token: 'onSuccessContainer', label: 'On success container', category: 'status', pairedRole: 'successContainer' },

  { token: 'info', label: 'Info', category: 'status', pairedRole: 'onInfo' },
  { token: 'onInfo', label: 'On info', category: 'status', pairedRole: 'info' },
  { token: 'infoContainer', label: 'Info container', category: 'status', pairedRole: 'onInfoContainer' },
  { token: 'onInfoContainer', label: 'On info container', category: 'status', pairedRole: 'infoContainer' },

  // Surface Hierarchy
  { token: 'surface', label: 'Surface', category: 'surface', pairedRole: 'onSurface' },
  { token: 'onSurface', label: 'On surface', category: 'surface', pairedRole: 'surface' },
  { token: 'surfaceVariant', label: 'Surface variant', category: 'surface', pairedRole: 'onSurfaceVariant' },
  { token: 'onSurfaceVariant', label: 'On surface variant', category: 'surface', pairedRole: 'surfaceVariant' },
  { token: 'surfaceDim', label: 'Surface dim', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceBright', label: 'Surface bright', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerLowest', label: 'Container lowest', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerLow', label: 'Container low', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainer', label: 'Surface container', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerHigh', label: 'Container high', category: 'surface', pairedRole: 'onSurface' },
  { token: 'surfaceContainerHighest', label: 'Container highest', category: 'surface', pairedRole: 'onSurface' },

  // Inverse & Utility
  { token: 'inverseSurface', label: 'Inverse surface', category: 'inverse-utility', pairedRole: 'inverseOnSurface' },
  { token: 'inverseOnSurface', label: 'Inverse on surface', category: 'inverse-utility', pairedRole: 'inverseSurface' },
  { token: 'inversePrimary', label: 'Inverse primary', category: 'inverse-utility', pairedRole: 'inverseOnPrimary' },
  { token: 'inverseOnPrimary', label: 'Inverse on primary', category: 'inverse-utility', pairedRole: 'inversePrimary' },
  { token: 'inversePrimaryContainer', label: 'Inverse primary container', category: 'inverse-utility', pairedRole: 'inverseOnPrimaryContainer' },
  { token: 'inverseOnPrimaryContainer', label: 'Inverse on primary container', category: 'inverse-utility', pairedRole: 'inversePrimaryContainer' },
  { token: 'outline', label: 'Outline', category: 'inverse-utility' },
  { token: 'outlineVariant', label: 'Outline variant', category: 'inverse-utility' },
  { token: 'shadow', label: 'Shadow', category: 'inverse-utility' },
  { token: 'scrim', label: 'Scrim', category: 'inverse-utility' },
]

export const TokensWithoutAaPreview = new Set<SystemColorToken>([
  'scrim',
  'shadow',
  'outline',
  'outlineVariant',
])
