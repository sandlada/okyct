
import type { RGB } from '../../models/index.ts'
import type { P3GamutCheckResult } from './p3-gamut-check-result.model.ts'
import { toneToY } from '../tone-to-y.ts'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'
import { linearToSrgb } from '../linear-to-srgb.ts'
import { solveOklabLForTargetY } from './solve-oklab-l-for-target-y.ts'

export function isInDisplayP3Gamut(h: number, c: number, t: number): P3GamutCheckResult {
  if (t <= 0.001) return { inGamut: true, p3Rgb: { r: 0, g: 0, b: 0 } }
  if (t >= 99.999) return { inGamut: true, p3Rgb: { r: 1, g: 1, b: 1 } }

  const targetY = toneToY(t)
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)

  const L = solveOklabLForTargetY(targetY, a, b)
  const xyz = oklabToXyz({ L, a, b })
  const linearP3 = xyzToLinearP3(xyz)

  const eps = 0.0001
  const inGamut = (
    linearP3.r >= -eps && linearP3.r <= 1.0 + eps &&
    linearP3.g >= -eps && linearP3.g <= 1.0 + eps &&
    linearP3.b >= -eps && linearP3.b <= 1.0 + eps
  )

  const p3Rgb: RGB = {
    r: Math.max(0, Math.min(1, linearToSrgb(linearP3.r))),
    g: Math.max(0, Math.min(1, linearToSrgb(linearP3.g))),
    b: Math.max(0, Math.min(1, linearToSrgb(linearP3.b))),
  }

  return { inGamut, p3Rgb }
}
