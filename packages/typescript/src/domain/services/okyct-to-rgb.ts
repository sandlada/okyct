
import type { RGB, OKYCT } from '../models/index.ts'
import { isInSrgbGamut } from './is-in-srgb-gamut.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'

export function okyctToRgb(okyct: OKYCT): RGB {
  if (okyct === null || typeof okyct !== 'object') {
    throw new Error('Invalid OKYCT input: expected an object with h, c, and t fields.')
  }
  const { h, c, t } = okyct
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(c) ||
    !Number.isFinite(t) ||
    c < 0 ||
    t < 0 ||
    t > 100
  ) {
    throw new Error(
      `Invalid OKYCT coordinates: h=${h}, c=${c}, t=${t}. Expected finite h, c >= 0, and t in [0, 100].`
    )
  }

  if (t <= 0.001) return { r: 0, g: 0, b: 0 }
  if (t >= 99.999) return { r: 1, g: 1, b: 1 }

  const check = isInSrgbGamut(h, c, t)
  if (check.inGamut) {
    return {
      r: Math.max(0, Math.min(1, check.rgb.r)),
      g: Math.max(0, Math.min(1, check.rgb.g)),
      b: Math.max(0, Math.min(1, check.rgb.b)),
    }
  }

  const maxC = findMaxChromaForTone(h, t)
  const safeCheck = isInSrgbGamut(h, maxC, t)
  return {
    r: Math.max(0, Math.min(1, safeCheck.rgb.r)),
    g: Math.max(0, Math.min(1, safeCheck.rgb.g)),
    b: Math.max(0, Math.min(1, safeCheck.rgb.b)),
  }
}
