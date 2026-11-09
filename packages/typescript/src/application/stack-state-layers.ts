/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ColorLayer, CompositedResult } from '../ports/inbound/layer-stacking.port.ts'
import { stackLayers } from './stack-layers.ts'

export const stackStateLayers = (states: Array<'hover' | 'focus' | 'pressed' | 'dragged'>) =>
  (pair: { base: string; stateColor: string }): CompositedResult => {
    const opacityMap: Record<string, number> = {
      hover: 0.08,
      focus: 0.12,
      pressed: 0.12,
      dragged: 0.16,
    }

    const layers: ColorLayer[] = states.map(s => ({
      color: pair.stateColor,
      opacity: opacityMap[s] ?? 0.08,
      label: `${s.toUpperCase()} 状态层 (${Math.round((opacityMap[s] ?? 0.08) * 100)}%)`,
    }))

    return stackLayers({ blendSpace: 'linear-srgb' })(layers)(pair.base)
  }
