
import {
  StateLayerStates,
  type StateLayerState,
  type StateLayersOption,
  type StatefulSystemColorToken,
  type SystemColorToken,
  type SystemStateLayerToken,
} from '../../ports/index.ts'
import type { PaletteSet } from '../palette-set.ts'

export type SchemeRoleKind = 'surface' | 'foreground' | 'accent'

export interface SchemeTokenRoleBinding {
  palette: keyof PaletteSet
  kind: SchemeRoleKind
}

export const StatefulTokenOverlayMap: Record<StatefulSystemColorToken, SystemColorToken> = {
  primary: 'onPrimary',
  onPrimary: 'primary',
  primaryContainer: 'onPrimaryContainer',
  onPrimaryContainer: 'primaryContainer',
  primaryFixed: 'onPrimaryFixed',
  primaryFixedDim: 'onPrimaryFixed',
  onPrimaryFixed: 'primaryFixed',
  onPrimaryFixedVariant: 'primaryFixed',

  secondary: 'onSecondary',
  onSecondary: 'secondary',
  secondaryContainer: 'onSecondaryContainer',
  onSecondaryContainer: 'secondaryContainer',

  tertiary: 'onTertiary',
  onTertiary: 'tertiary',
  tertiaryContainer: 'onTertiaryContainer',
  onTertiaryContainer: 'tertiaryContainer',

  error: 'onError',
  onError: 'error',
  errorContainer: 'onErrorContainer',
  onErrorContainer: 'errorContainer',

  warning: 'onWarning',
  onWarning: 'warning',
  warningContainer: 'onWarningContainer',
  onWarningContainer: 'warningContainer',

  success: 'onSuccess',
  onSuccess: 'success',
  successContainer: 'onSuccessContainer',
  onSuccessContainer: 'successContainer',

  info: 'onInfo',
  onInfo: 'info',
  infoContainer: 'onInfoContainer',
  onInfoContainer: 'infoContainer',

  surface: 'onSurface',
  onSurface: 'surface',
  surfaceVariant: 'onSurfaceVariant',
  onSurfaceVariant: 'surfaceVariant',
  surfaceDim: 'onSurface',
  surfaceBright: 'onSurface',
  surfaceContainerLowest: 'onSurface',
  surfaceContainerLow: 'onSurface',
  surfaceContainer: 'onSurface',
  surfaceContainerHigh: 'onSurface',
  surfaceContainerHighest: 'onSurface',

  inverseSurface: 'inverseOnSurface',
  inverseOnSurface: 'inverseSurface',
  inversePrimary: 'inverseOnPrimary',
  inverseOnPrimary: 'inversePrimary',
  inversePrimaryContainer: 'inverseOnPrimaryContainer',
  inverseOnPrimaryContainer: 'inversePrimaryContainer',
}

export function normalizeStateLayerStates(option?: StateLayersOption): StateLayerState[] {
  if (option === undefined || option === false) return []
  if (option === true) return [...StateLayerStates]
  if (!Array.isArray(option)) {
    throw new Error('Invalid stateLayers option: expected a boolean or an array of state names.')
  }
  const seen = new Set<StateLayerState>()
  const result: StateLayerState[] = []
  for (const state of option) {
    if (!StateLayerStates.includes(state)) {
      throw new Error(
        `Invalid state layer name: "${String(state)}". Expected one of: ${StateLayerStates.join(', ')}.`
      )
    }
    if (!seen.has(state)) {
      seen.add(state)
      result.push(state)
    }
  }
  return result
}

export function formatStateLayerKey<TToken extends string, TState extends StateLayerState>(
  token: TToken,
  state: TState
): `${TToken}${Capitalize<TState>}` {
  return `${token}${state.charAt(0).toUpperCase()}${state.slice(1)}` as `${TToken}${Capitalize<TState>}`
}

export type SystemStateKey = SystemStateLayerToken

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
