
import type { RGB, OKYCT, GamutCheckResult } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { oklabToXyz } from './internal/oklab-to-xyz.ts'
import { xyzToLinearRgb } from './internal/xyz-to-linear-rgb.ts'
import { linearToSrgb } from './linear-to-srgb.ts'
import { solveOklabLForTargetY } from './internal/solve-oklab-l-for-target-y.ts'

export function isInSrgbGamut(color: OKYCT): GamutCheckResult
export function isInSrgbGamut(h: number, c: number, t: number): GamutCheckResult
export function isInSrgbGamut(hOrColor: number | OKYCT, c?: number, t?: number): GamutCheckResult {
  const hVal = typeof hOrColor === 'number' ? hOrColor : hOrColor.h
  const cVal = typeof hOrColor === 'number' ? (c ?? NaN) : hOrColor.c
  const tVal = typeof hOrColor === 'number' ? (t ?? NaN) : hOrColor.t

  if (
    !Number.isFinite(hVal) ||
    !Number.isFinite(cVal) ||
    !Number.isFinite(tVal) ||
    cVal < 0 ||
    tVal < 0 ||
    tVal > 100
  ) {
    throw new Error(
      `Invalid OKYCT coordinates for gamut check: h=${hVal}, c=${cVal}, t=${tVal}. Expected finite h, c >= 0, and t in [0, 100].`
    )
  }

  if (tVal <= 0.001) return { inGamut: true, rgb: { r: 0, g: 0, b: 0 } }
  if (tVal >= 99.999) return { inGamut: true, rgb: { r: 1, g: 1, b: 1 } }

  const targetY = toneToY(tVal)
  const rad = (hVal * Math.PI) / 180
  const a = cVal * Math.cos(rad)
  const b = cVal * Math.sin(rad)

  const L = solveOklabLForTargetY(targetY, a, b)
  const xyz = oklabToXyz({ L, a, b })
  const linear = xyzToLinearRgb(xyz)

  const srgb: RGB = {
    r: linearToSrgb(linear.r),
    g: linearToSrgb(linear.g),
    b: linearToSrgb(linear.b),
  }

  const eps = 1e-5
  const inGamut = (
    srgb.r >= -eps && srgb.r <= 1.0 + eps &&
    srgb.g >= -eps && srgb.g <= 1.0 + eps &&
    srgb.b >= -eps && srgb.b <= 1.0 + eps
  )

  return { inGamut, rgb: srgb }
}
