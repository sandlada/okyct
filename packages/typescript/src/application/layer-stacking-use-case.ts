/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ILayerStackingPort } from '../ports/inbound/layer-stacking.port.ts'
import { stackLayers } from './stack-layers.ts'
import { stackStateLayers } from './stack-state-layers.ts'
import { auditStackedContrast } from './audit-stacked-contrast.ts'
import { stackToCssColorMix } from './stack-to-css-color-mix.ts'

export class LayerStackingUseCase implements ILayerStackingPort {
  stackLayers = stackLayers
  stackStateLayers = stackStateLayers
  auditStackedContrast = auditStackedContrast
  stackToCssColorMix = stackToCssColorMix
}
