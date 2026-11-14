import type { GamutTarget, RGB } from '../../models/index.ts'

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

  const dl = 0.3963377774 * a + 0.2158037573 * b
  const dm = -0.1055613458 * a - 0.0638541728 * b
  const ds = -0.0894841775 * a - 1.2914855480 * b

  let L =
    targetY <= 0
      ? 0
      : targetY >= 1.0
      ? 1.0
      : initialL !== undefined && Number.isFinite(initialL)
      ? initialL
      : Math.cbrt(targetY)

  let l_ = L + dl
  let m_ = L + dm
  let s_ = L + ds
  let l3 = l_ * l_ * l_
  let m3 = m_ * m_ * m_
  let s3 = s_ * s_ * s_

  if (targetY > 0 && targetY < 1.0) {
    let converged = false
    for (let i = 0; i < 10; i++) {
      const l2 = l_ * l_
      const m2 = m_ * m_
      const s2 = s_ * s_
      l3 = l2 * l_
      m3 = m2 * m_
      s3 = s2 * s_

      const currentY = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3
      const f = currentY - targetY
      if (Math.abs(f) < 1e-12) {
        converged = true
        break
      }

      const d1 = -0.1217405352 * l2 + 3.3367706088 * m2 - 0.2150300361 * s2
      if (Math.abs(d1) < 1e-12) {
        converged = true
        break
      }

      const d2 = -0.2434810704 * l_ + 6.6735412176 * m_ - 0.4300600722 * s_
      const denom = 2 * d1 * d1 - f * d2
      L = Math.abs(denom) < 1e-15 ? L - f / d1 : L - (2 * f * d1) / denom
      L = Math.max(0, Math.min(1.0, L))
      l_ = L + dl
      m_ = L + dm
      s_ = L + ds
    }
    if (!converged) {
      l3 = l_ * l_ * l_
      m3 = m_ * m_ * m_
      s3 = s_ * s_ * s_
    }
  }

  const x = 1.2270138511 * l3 - 0.5577999807 * m3 + 0.2812561490 * s3
  const y = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3
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
