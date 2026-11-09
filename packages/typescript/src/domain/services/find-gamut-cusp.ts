/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GamutCusp } from '../models/index.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'

export function findGamutCusp(h: number): GamutCusp {
  let bestT = 50
  let maxC = 0

  for (let t = 20; t <= 90; t += 5) {
    const c = findMaxChromaForTone(h, t)
    if (c > maxC) {
      maxC = c
      bestT = t
    }
  }

  const startT = Math.max(10, bestT - 6)
  const endT = Math.min(95, bestT + 6)
  for (let t = startT; t <= endT; t += 1) {
    const c = findMaxChromaForTone(h, t)
    if (c > maxC) {
      maxC = c
      bestT = t
    }
  }

  return { tone: bestT, chroma: maxC }
}
