/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hexToRgb } from './hex-to-rgb.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'

export function hexToOkyct(hex: string) {
  return rgbToOkyct(hexToRgb(hex))
}
