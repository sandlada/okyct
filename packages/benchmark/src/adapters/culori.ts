/**
 * culori 公平适配器：固定 OKLCH h/c，二分 OKLCH L 命中目标 CIE L*
 */

import type { RGB } from '@sandlada/okyct'
import { oklch, clampChroma, rgb } from 'culori'
import { hexToCielab } from '../referee/cielab.ts'
import { quantizeNearest } from '../quantizer.ts'

export interface AdapterRgbStop {
  readonly targetLStar: number
  readonly continuousRgb: RGB
  readonly hex: string
  readonly alreadyQuantized: boolean
}

const LStarMatchTolerance = 0.05
const MaxBinaryIterations = 24

export function generateCuloriFairStops(
  sourceHex: string,
  targetLStars: readonly number[],
): AdapterRgbStop[] {
  const seedOklch = oklch(sourceHex)
  const baseC = seedOklch?.c ?? 0.15
  const baseH = seedOklch?.h ?? 0

  return targetLStars.map((targetLStar) => {
    let low = 0
    let high = 1
    let bestL = 0.5
  let bestRgb: RGB = { r: 0, g: 0, b: 0 }

    for (let i = 0; i < MaxBinaryIterations; i++) {
      const mid = (low + high) / 2
      const clamped = clampChroma(
        { mode: 'oklch' as const, l: mid, c: baseC, h: baseH },
        'oklch',
      )
      const rgbColor = rgb(clamped)
      if (!rgbColor || rgbColor.mode !== 'rgb') {
        high = mid
        continue
      }
      const candidate: RGB = {
        r: rgbColor.r ?? 0,
        g: rgbColor.g ?? 0,
        b: rgbColor.b ?? 0,
      }
      const hex = quantizeNearest(candidate)
      const lab = hexToCielab(hex)
      const err = lab.L - targetLStar
      bestL = mid
      bestRgb = candidate
      if (Math.abs(err) <= LStarMatchTolerance) break
      if (err < 0) low = mid
      else high = mid
    }

    const finalClamped = clampChroma(
      { mode: 'oklch' as const, l: bestL, c: baseC, h: baseH },
      'oklch',
    )
    const finalRgb = rgb(finalClamped)
    const continuousRgb: RGB = finalRgb
      ? { r: finalRgb.r ?? 0, g: finalRgb.g ?? 0, b: finalRgb.b ?? 0 }
      : bestRgb

    return {
      targetLStar,
      continuousRgb,
      hex: quantizeNearest(continuousRgb),
      alreadyQuantized: false,
    }
  })
}
