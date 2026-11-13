
import type { ColorLayer, CompositedResult } from '../ports/inbound/layer-stacking.port.ts'
import { stackLayers } from './stack-layers.ts'

function getStateLayerOpacity(state: 'hover' | 'focus' | 'pressed' | 'dragged'): number {
  switch (state) {
    case 'hover':
      return 0.08
    case 'focus':
    case 'pressed':
      return 0.12
    case 'dragged':
      return 0.16
    default:
      throw new Error(`Invalid state layer: "${String(state)}". Expected one of: hover, focus, pressed, dragged.`)
  }
}

export const stackStateLayers = (states: Array<'hover' | 'focus' | 'pressed' | 'dragged'>) => {
  if (!Array.isArray(states)) {
    throw new Error('Invalid state layers list: expected an array of state names.')
  }
  const opacities = states.map((state) => ({
    state,
    opacity: getStateLayerOpacity(state),
  }))

  return (pair: { base: string; stateColor: string }): CompositedResult => {
    if (pair === null || typeof pair !== 'object') {
      throw new Error('Invalid state layer pair: expected an object with base and stateColor hex strings.')
    }
    const layers: ColorLayer[] = opacities.map(({ state, opacity }) => ({
      color: pair.stateColor,
      opacity,
      label: `${state.toUpperCase()} 状态层 (${Math.round(opacity * 100)}%)`,
    }))

    return stackLayers({ blendSpace: 'linear-srgb' })(layers)(pair.base)
  }
}
