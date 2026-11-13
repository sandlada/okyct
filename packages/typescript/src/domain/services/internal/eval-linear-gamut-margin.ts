import type { GamutTarget, RGB } from '../../models/index.ts'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { solveOklabLForTargetY } from './solve-oklab-l-for-target-y.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'

export interface LinearGamutEvaluation {
  margin: number
  L: number
  linear: RGB
}

export function evalLinearGamutMargin(
  targetY: number,
  a: number,
  b: number,
  gamut: GamutTarget,
  initialL?: number
): LinearGamutEvaluation {
  const L = solveOklabLForTargetY(targetY, a, b, initialL)
  const xyz = oklabToXyz({ L, a, b })
  const linear = gamut === 'display-p3' ? xyzToLinearP3(xyz) : xyzToLinearRgb(xyz)
  const margin = Math.min(
    linear.r,
    linear.g,
    linear.b,
    1 - linear.r,
    1 - linear.g,
    1 - linear.b
  )
  return { margin, L, linear }
}
