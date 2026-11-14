/**
 * [Hexagonal Layer: Domain Service]
 * Exports an OKYCT color directly to a floating-point CSS Color 4 oklch() string,
 * bypassing 8-bit sRGB integer quantization for zero quantization hue drift.
 */

import type { OKYCT } from '../models/index.ts'
import { solveOklabLForTargetY } from './internal/solve-oklab-l-for-target-y.ts'
import { toneToY } from './tone-to-y.ts'

export function okyctToOklchCss(okyct: OKYCT): string {
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

  const y = toneToY(t)
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const l = solveOklabLForTargetY(y, a, b)
  const hNorm = ((h % 360) + 360) % 360
  return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(4)} ${hNorm.toFixed(2)})`
}
