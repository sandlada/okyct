import {
  StatefulSystemColorTokens,
  type DynamicSchemeColors,
  type SchemeStateLayerTokens,
  type StateLayerBlendSpace,
  type StateLayersOption,
} from '../ports/index.ts'
import { compositeGuardedStateHex } from './internal/composite-guarded-state-hex.ts'
import {
  StatefulTokenOverlayMap,
  formatStateLayerKey,
  normalizeStateLayerStates,
} from './internal/scheme-token-role-map.ts'

export interface ResolveSchemeStateLayersOptions {
  blendSpace?: StateLayerBlendSpace
  contrastGuard?: boolean
}

export function resolveSchemeStateLayers(
  scheme: DynamicSchemeColors,
  stateLayers?: StateLayersOption,
  options: ResolveSchemeStateLayersOptions = {}
): SchemeStateLayerTokens {
  if (scheme === null || typeof scheme !== 'object' || Array.isArray(scheme)) {
    throw new Error('Invalid scheme input: expected a DynamicSchemeColors object.')
  }

  const states = normalizeStateLayerStates(stateLayers)
  if (states.length === 0) return {}

  const blendSpace: StateLayerBlendSpace = options.blendSpace ?? 'okyct'
  const contrastGuard = options.contrastGuard ?? false

  const result: SchemeStateLayerTokens = {}
  for (const baseToken of StatefulSystemColorTokens) {
    const baseHex = scheme[baseToken]
    const overlayToken = StatefulTokenOverlayMap[baseToken]
    const overlayHex = scheme[overlayToken]

    for (const state of states) {
      const key = formatStateLayerKey(baseToken, state)
      result[key] = compositeGuardedStateHex(
        baseHex,
        overlayHex,
        state,
        blendSpace,
        contrastGuard
      )
    }
  }

  return result
}
