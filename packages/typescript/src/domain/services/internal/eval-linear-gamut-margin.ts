import type { GamutTarget, RGB } from '../../models/index.ts'
import { OklabHalleySolverCoeffs, solveOklabLForTargetY } from './solve-oklab-l-for-target-y.ts'

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
  if (a === 0 && b === 0) {
    const yClamped = Math.max(0, Math.min(1, targetY))
    return {
      margin: Math.min(yClamped, 1 - yClamped),
      L: Math.cbrt(yClamped),
      linear: { r: yClamped, g: yClamped, b: yClamped },
    }
  }

  const L = solveOklabLForTargetY(targetY, a, b, initialL)
  const l_ = L + OklabHalleySolverCoeffs.DlA * a + OklabHalleySolverCoeffs.DlB * b
  const m_ = L + OklabHalleySolverCoeffs.DmA * a + OklabHalleySolverCoeffs.DmB * b
  const s_ = L + OklabHalleySolverCoeffs.DsA * a + OklabHalleySolverCoeffs.DsB * b
  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  const x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3
  const y =
    OklabHalleySolverCoeffs.YL3 * l3 +
    OklabHalleySolverCoeffs.YM3 * m3 +
    OklabHalleySolverCoeffs.YS3 * s3
  const z = -0.0763812845 * l3 - 0.4214819784 * m3 + 1.5861632204 * s3

  let r: number
  let g: number
  let bLin: number
  if (gamut === 'display-p3') {
    r = 2.4934969 * x - 0.9313836 * y - 0.4027108 * z
    g = -0.8294890 * x + 1.7626641 * y + 0.0236247 * z
    bLin = 0.0358458 * x - 0.0761724 * y + 0.9568845 * z
  } else {
    r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z
    bLin = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
  }

  const margin = Math.min(r, g, bLin, 1 - r, 1 - g, 1 - bLin)
  return { margin, L, linear: { r, g, b: bLin } }
}
