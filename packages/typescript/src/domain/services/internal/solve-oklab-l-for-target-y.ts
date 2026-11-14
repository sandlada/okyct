/**
 * [Domain Service — module internal]
 * Single-variable Halley 3rd-order solver for OKLab L given target CIE Y and fixed (a, b).
 */

export function solveOklabLForTargetY(
  targetY: number,
  a: number,
  b: number,
  initialL?: number
): number {
  if (targetY <= 0) return 0
  if (targetY >= 1.0) return 1.0

  let L = initialL !== undefined && Number.isFinite(initialL) ? initialL : Math.cbrt(targetY)

  for (let i = 0; i < 10; i++) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b

    const l3 = l_ * l_ * l_
    const m3 = m_ * m_ * m_
    const s3 = s_ * s_ * s_

    const currentY = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3
    const f = currentY - targetY
    if (Math.abs(f) < 1e-12) break

    const d1 = -0.1217405352 * l_ * l_ + 3.3367706088 * m_ * m_ - 0.2150300361 * s_ * s_
    if (Math.abs(d1) < 1e-12) break

    const d2 = -0.2434810704 * l_ + 6.6735412176 * m_ - 0.4300600722 * s_
    const denom = 2 * d1 * d1 - f * d2
    if (Math.abs(denom) < 1e-15) {
      L = L - f / d1
    } else {
      L = L - (2 * f * d1) / denom
    }
    L = Math.max(0, Math.min(1.0, L))
  }

  return L
}
