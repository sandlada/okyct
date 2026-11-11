/**
 * [Domain Service — module internal]
 * 通用色域尖峰 (Gamut Cusp) 搜索算法
 */

import type { GamutCusp } from '../../models/index.ts'

export function findCuspForMaxChroma(
  h: number,
  maxChromaAtTone: (hue: number, tone: number) => number
): GamutCusp {
  let bestT = 50
  let maxC = 0

  for (let t = 20; t <= 90; t += 5) {
    const c = maxChromaAtTone(h, t)
    if (c > maxC) {
      maxC = c
      bestT = t
    }
  }

  const startT = Math.max(10, bestT - 6)
  const endT = Math.min(95, bestT + 6)
  for (let t = startT; t <= endT; t += 1) {
    const c = maxChromaAtTone(h, t)
    if (c > maxC) {
      maxC = c
      bestT = t
    }
  }

  return { tone: bestT, chroma: maxC }
}
