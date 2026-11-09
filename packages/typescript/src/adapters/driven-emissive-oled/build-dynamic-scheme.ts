/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildDynamicSchemeWithPhysics, type PaletteSet } from '../../application/index.ts'
import type { DynamicSchemeColors } from '../../ports/inbound/scheme-building.port.ts'
import type { EmissiveSchemeOptions } from '../../ports/outbound/display-physics.port.ts'
import { oledDisplayPhysicsAdapter } from './oled-display-physics-adapter.ts'

export function buildDynamicScheme(
  palettes: PaletteSet,
  isDark: boolean,
  contrastLevel = 0.0,
  emissiveOptions: EmissiveSchemeOptions = {}
): DynamicSchemeColors {
  return buildDynamicSchemeWithPhysics(
    palettes,
    isDark,
    contrastLevel,
    emissiveOptions,
    oledDisplayPhysicsAdapter
  )
}
