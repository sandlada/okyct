/**
 * OKYCT 公平适配器：TonalPalette 包络 + okyctToRgb + 共享 quantizeNearest
 */

import {
  hexToOkyct,
  okyctToRgb,
  findMaxChromaForTone,
  type RGB,
} from '@sandlada/okyct'
import { quantizeNearest } from '../quantizer.ts'

export interface AdapterRgbStop {
  readonly targetLStar: number
  readonly continuousRgb: RGB
  readonly hex: string
  readonly alreadyQuantized: boolean
}

function effectiveChroma(targetChroma: number, tone: number): number {
  let effective = targetChroma
  if (tone > 90) {
    effective *= Math.max(0.2, (100 - tone) / 10)
  } else if (tone < 15) {
    effective *= Math.max(0.3, tone / 15)
  }
  return effective
}

export function generateOkyctFairStops(
  sourceHex: string,
  targetLStars: readonly number[],
): AdapterRgbStop[] {
  const seed = hexToOkyct(sourceHex)
  return targetLStars.map((targetLStar) => {
    let effective = effectiveChroma(seed.c, targetLStar)
    const maxGamut = findMaxChromaForTone(seed.h, targetLStar)
    const finalChroma = Math.min(effective, maxGamut)
    const continuousRgb = okyctToRgb({
      h: seed.h,
      c: finalChroma,
      t: targetLStar,
    })
  return {
      targetLStar,
      continuousRgb,
      hex: quantizeNearest(continuousRgb),
      alreadyQuantized: false,
    }
  })
}
