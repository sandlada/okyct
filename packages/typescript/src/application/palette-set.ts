/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PaletteSet as PortPaletteSet } from '../ports/inbound/palette-generation.port.ts'
import type { TonalPalette } from './tonal-palette.ts'

export type PaletteSet = PortPaletteSet<TonalPalette>
