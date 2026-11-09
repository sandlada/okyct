
import type { RGB, GamutCheckResult } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'
import { linearToSrgb } from './linear-to-srgb.ts'
import { solveOklabLForTargetY } from './internal/solve-oklab-l-for-target-y.ts'

export function isInSrgbGamut(h: number, c: number, t: number): GamutCheckResult {
  if (t <= 0.001) return { inGamut: true, rgb: { r: 0, g: 0, b: 0 } }
  if (t >= 99.999) return { inGamut: true, rgb: { r: 1, g: 1, b: 1 } }

  const targetY = toneToY(t)
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)

  const L = solveOklabLForTargetY(targetY, a, b)
  const xyz = oklabToXyz({ L, a, b })
  const linear = xyzToLinearRgb(xyz)

  const eps = 0.0001
  const inGamut = (
    linear.r >= -eps && linear.r <= 1.0 + eps &&
    linear.g >= -eps && linear.g <= 1.0 + eps &&
    linear.b >= -eps && linear.b <= 1.0 + eps
  )

  const srgb: RGB = {
    r: linearToSrgb(linear.r),
    g: linearToSrgb(linear.g),
    b: linearToSrgb(linear.b),
  }

  return { inGamut, rgb: srgb }
}
