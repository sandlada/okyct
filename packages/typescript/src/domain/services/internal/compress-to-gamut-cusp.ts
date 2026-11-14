/**
 * [Domain Service — module internal]
 * Cusp-anchored ray compression for out-of-gamut colors with zero hue drift.
 */

import type { GamutTarget, RGB } from '../../models/index.ts'
import { toneToY } from '../tone-to-y.ts'
import { evalLinearGamutMargin } from './eval-linear-gamut-margin.ts'
import { findCuspForMaxChroma } from './find-cusp-for-max-chroma.ts'

const CuspAnchorPull = 0.65

export function compressToGamutCusp(
  h: number,
  c: number,
  t: number,
  gamut: GamutTarget
): RGB {
  const cusp = findCuspForMaxChroma(h, gamut)
  const tAnchor = Math.max(0.5, Math.min(99.5, t + (cusp.tone - t) * CuspAnchorPull))
  const rad = (h * Math.PI) / 180
  const cosH = Math.cos(rad)
  const sinH = Math.sin(rad)

  let lo = 0
  let hi = 1
  let lastL: number | undefined
  const yAnchor = toneToY(tAnchor)
  let bestLinear: RGB = { r: yAnchor, g: yAnchor, b: yAnchor }

  for (let i = 0; i < 16; i++) {
    if (hi - lo < 1e-5) break
    const mid = (lo + hi) * 0.5
    const tMid = tAnchor + mid * (t - tAnchor)
    const cMid = mid * c
    const targetY = toneToY(tMid)
    const ev = evalLinearGamutMargin(targetY, cMid * cosH, cMid * sinH, gamut, lastL)
    if (ev.margin >= -1e-6) {
      lo = mid
      lastL = ev.L
      bestLinear = ev.linear
    } else {
      hi = mid
    }
  }

  return bestLinear
}
