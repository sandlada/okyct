/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function isWarmHue(hue: number): boolean {
  return (hue >= 20 && hue <= 110) || hue >= 340
}
