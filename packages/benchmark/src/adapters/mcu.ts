/**
 * Google MCU：原生 8-bit HCT/ARGB，不再二次量化
 */

import { hexToRgb, type RGB } from '@sandlada/okyct'
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  TonalPalette,
} from '@material/material-color-utilities'
import { hexToCielab } from '../referee/cielab.ts'

export interface AdapterRgbStop {
  readonly targetLStar: number
  readonly continuousRgb: RGB
  readonly hex: string
  readonly alreadyQuantized: boolean
}

const LStarMatchTolerance = 0.2
const MaxBinaryIterations = 16

export function generateMcuFairStops(
  sourceHex: string,
  targetLStars: readonly number[],
): AdapterRgbStop[] {
  const argb = argbFromHex(sourceHex)
  const seedHct = Hct.fromInt(argb)
  const palette = TonalPalette.fromHueAndChroma(seedHct.hue, seedHct.chroma)

  return targetLStars.map((targetLStar) => {
    let low = 0
    let high = 100
    let bestTone = targetLStar
    let bestHex = '#000000'

    for (let i = 0; i < MaxBinaryIterations; i++) {
      const mid = (low + high) / 2
      const stopArgb = palette.tone(mid)
      const hex = hexFromArgb(stopArgb).toUpperCase()
      const lab = hexToCielab(hex)
      const err = lab.L - targetLStar
      bestTone = mid
      bestHex = hex
      if (Math.abs(err) <= LStarMatchTolerance) break
      if (err < 0) low = mid
      else high = mid
    }

    const finalArgb = palette.tone(bestTone)
    const hex = hexFromArgb(finalArgb).toUpperCase()
    const continuousRgb = hexToRgb(hex)

    return {
      targetLStar,
      continuousRgb,
      hex,
      alreadyQuantized: true,
    }
  })
}
