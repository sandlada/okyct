import { getContrastRatio } from '../../domain/index.ts'
import type { StateLayerBlendSpace, StateLayerState } from '../../ports/inbound/scheme-building.port.ts'
import { stackLayers } from '../stack-layers.ts'

const StateOpacityMap: Record<StateLayerState, number> = {
  hovered: 0.08,
  focused: 0.12,
  pressed: 0.12,
  dragged: 0.16,
}

const MinContrastGuardRatio = 4.5

function compositeStateHex(
  baseHex: string,
  overlayHex: string,
  state: StateLayerState,
  opacity: number,
  blendSpace: StateLayerBlendSpace
): string {
  return stackLayers({ blendSpace })(
    [
      {
        color: overlayHex,
        opacity,
        label: `${state.toUpperCase()} State Layer (${Math.round(opacity * 100)}%)`,
      },
    ]
  )(baseHex).finalHex
}

export function compositeGuardedStateHex(
  baseHex: string,
  overlayHex: string,
  state: StateLayerState,
  blendSpace: StateLayerBlendSpace,
  contrastGuard: boolean
): string {
  const nominalOpacity = StateOpacityMap[state]
  const nominalHex = compositeStateHex(baseHex, overlayHex, state, nominalOpacity, blendSpace)

  if (!contrastGuard) return nominalHex
  if (getContrastRatio(baseHex, overlayHex) < MinContrastGuardRatio) return nominalHex
  if (getContrastRatio(nominalHex, overlayHex) >= MinContrastGuardRatio) return nominalHex

  let low = 0
  let high = nominalOpacity
  let bestHex = baseHex
  for (let i = 0; i < 8; i++) {
    const mid = (low + high) * 0.5
    const candHex = compositeStateHex(baseHex, overlayHex, state, mid, blendSpace)
    if (getContrastRatio(candHex, overlayHex) >= MinContrastGuardRatio) {
      bestHex = candHex
      low = mid
    } else {
      high = mid
    }
  }
  return bestHex
}
