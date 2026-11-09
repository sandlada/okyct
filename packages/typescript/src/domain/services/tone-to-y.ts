/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function toneToY(tone: number): number {
  const t = Math.max(0, Math.min(100, tone))
  if (t <= 8.0) {
    return (t / 903.2962962) / 1.0
  }
  const yRoot = (t + 16.0) / 116.0
  return yRoot * yRoot * yRoot
}
