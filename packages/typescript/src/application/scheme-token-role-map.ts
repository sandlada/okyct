
import type { SystemColorToken } from '../ports/inbound/scheme-building.port.ts'
import type { PaletteSet } from './palette-set.ts'

export type SchemeRoleKind = 'surface' | 'foreground' | 'accent'

export interface SchemeTokenRoleBinding {
  palette: keyof PaletteSet
  kind: SchemeRoleKind
}

export const SchemeTokenRoleMap: Record<SystemColorToken, SchemeTokenRoleBinding> = {
  primary: { palette: 'primary', kind: 'accent' },
  onPrimary: { palette: 'primary', kind: 'foreground' },
  primaryContainer: { palette: 'primary', kind: 'accent' },
  onPrimaryContainer: { palette: 'primary', kind: 'foreground' },
  primaryFixed: { palette: 'primary', kind: 'accent' },
  primaryFixedDim: { palette: 'primary', kind: 'accent' },
  onPrimaryFixed: { palette: 'primary', kind: 'foreground' },
  onPrimaryFixedVariant: { palette: 'primary', kind: 'foreground' },

  secondary: { palette: 'secondary', kind: 'accent' },
  onSecondary: { palette: 'secondary', kind: 'foreground' },
  secondaryContainer: { palette: 'secondary', kind: 'accent' },
  onSecondaryContainer: { palette: 'secondary', kind: 'foreground' },

  tertiary: { palette: 'tertiary', kind: 'accent' },
  onTertiary: { palette: 'tertiary', kind: 'foreground' },
  tertiaryContainer: { palette: 'tertiary', kind: 'accent' },
  onTertiaryContainer: { palette: 'tertiary', kind: 'foreground' },

  error: { palette: 'error', kind: 'accent' },
  onError: { palette: 'error', kind: 'foreground' },
  errorContainer: { palette: 'error', kind: 'accent' },
  onErrorContainer: { palette: 'error', kind: 'foreground' },

  warning: { palette: 'warning', kind: 'accent' },
  onWarning: { palette: 'warning', kind: 'foreground' },
  warningContainer: { palette: 'warning', kind: 'accent' },
  onWarningContainer: { palette: 'warning', kind: 'foreground' },

  success: { palette: 'success', kind: 'accent' },
  onSuccess: { palette: 'success', kind: 'foreground' },
  successContainer: { palette: 'success', kind: 'accent' },
  onSuccessContainer: { palette: 'success', kind: 'foreground' },

  info: { palette: 'info', kind: 'accent' },
  onInfo: { palette: 'info', kind: 'foreground' },
  infoContainer: { palette: 'info', kind: 'accent' },
  onInfoContainer: { palette: 'info', kind: 'foreground' },

  surface: { palette: 'neutral', kind: 'surface' },
  onSurface: { palette: 'neutral', kind: 'foreground' },
  surfaceVariant: { palette: 'neutralVariant', kind: 'surface' },
  onSurfaceVariant: { palette: 'neutralVariant', kind: 'foreground' },

  surfaceDim: { palette: 'neutral', kind: 'surface' },
  surfaceBright: { palette: 'neutral', kind: 'surface' },
  surfaceContainerLowest: { palette: 'neutral', kind: 'surface' },
  surfaceContainerLow: { palette: 'neutral', kind: 'surface' },
  surfaceContainer: { palette: 'neutral', kind: 'surface' },
  surfaceContainerHigh: { palette: 'neutral', kind: 'surface' },
  surfaceContainerHighest: { palette: 'neutral', kind: 'surface' },

  outline: { palette: 'neutralVariant', kind: 'foreground' },
  outlineVariant: { palette: 'neutralVariant', kind: 'surface' },
  inverseSurface: { palette: 'neutral', kind: 'surface' },
  inverseOnSurface: { palette: 'neutral', kind: 'foreground' },
  inversePrimary: { palette: 'primary', kind: 'accent' },
  inverseOnPrimary: { palette: 'primary', kind: 'foreground' },
  inversePrimaryContainer: { palette: 'primary', kind: 'accent' },
  inverseOnPrimaryContainer: { palette: 'primary', kind: 'foreground' },
  scrim: { palette: 'neutral', kind: 'surface' },
  shadow: { palette: 'neutral', kind: 'surface' },
}
