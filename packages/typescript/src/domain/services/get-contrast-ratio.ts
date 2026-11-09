/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toneToY } from './tone-to-y.ts'

export function getContrastRatio(toneA: number, toneB: number): number {
  const yA = toneToY(toneA)
  const yB = toneToY(toneB)
  const lighter = Math.max(yA, yB)
  const darker = Math.min(yA, yB)
  return (lighter + 0.05) / (darker + 0.05)
}
