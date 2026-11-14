
import type { ColorLayer, CompositedResult } from '../ports/inbound/layer-stacking.port.ts'
import { stackLayers } from './stack-layers.ts'

type StackStateName = 'hovered' | 'focused' | 'pressed' | 'dragged' | 'hover' | 'focus'

function getStateLayerOpacity(state: StackStateName): number {
  switch (state) {
    case 'hovered':
    case 'hover':
      return 0.08
    case 'focused':
    case 'focus':
    case 'pressed':
      return 0.12
    case 'dragged':
      return 0.16
    default:
      throw new Error(
        `Invalid state layer: "${String(state)}". Expected one of: hovered, focused, pressed, dragged.`
      )
  }
}

export const stackStateLayers = (states: Array<StackStateName>) => {
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
      label: `${state.toUpperCase()} State Layer (${Math.round(opacity * 100)}%)`,
    }))

    return stackLayers({ blendSpace: 'okyct' })(layers)(pair.base)
  }
}
