/**
 * [Domain Service — module internal]
 * Single-variable Halley 3rd-order solver (with Newton-Raphson fallback)
 * for OKLab L given target CIE Y and fixed (a, b).
 */

export const OklabHalleySolverCoeffs = {
  DlA: 0.3963377774,
  DlB: 0.2158037573,
  DmA: -0.1055613458,
  DmB: -0.0638541728,
  DsA: -0.0894841775,
  DsB: -1.2914855480,
  YL3: -0.0405801784,
  YM3: 1.1122568696,
  YS3: -0.0716766787,
  D1L2: -0.1217405352,
  D1M2: 3.3367706088,
  D1S2: -0.2150300361,
  D2L1: -0.2434810704,
  D2M1: 6.6735412176,
  D2S1: -0.4300600722,
} as const

export function solveOklabLForTargetY(
  targetY: number,
  a: number,
  b: number,
  initialL?: number
): number {
  if (targetY <= 0) return 0
  if (targetY >= 1.0) return 1.0
  if (a === 0 && b === 0) return Math.cbrt(targetY)

  const dl = OklabHalleySolverCoeffs.DlA * a + OklabHalleySolverCoeffs.DlB * b
  const dm = OklabHalleySolverCoeffs.DmA * a + OklabHalleySolverCoeffs.DmB * b
  const ds = OklabHalleySolverCoeffs.DsA * a + OklabHalleySolverCoeffs.DsB * b

  let L = initialL !== undefined && Number.isFinite(initialL) ? initialL : Math.cbrt(targetY)

  for (let i = 0; i < 10; i++) {
    const l_ = L + dl
    const m_ = L + dm
    const s_ = L + ds

    const l2 = l_ * l_
    const m2 = m_ * m_
    const s2 = s_ * s_

    const currentY =
      OklabHalleySolverCoeffs.YL3 * l2 * l_ +
      OklabHalleySolverCoeffs.YM3 * m2 * m_ +
      OklabHalleySolverCoeffs.YS3 * s2 * s_
    const f = currentY - targetY
    if (Math.abs(f) < 1e-12) break

    const d1 =
      OklabHalleySolverCoeffs.D1L2 * l2 +
      OklabHalleySolverCoeffs.D1M2 * m2 +
      OklabHalleySolverCoeffs.D1S2 * s2
    if (Math.abs(d1) < 1e-12) break

    const d2 =
      OklabHalleySolverCoeffs.D2L1 * l_ +
      OklabHalleySolverCoeffs.D2M1 * m_ +
      OklabHalleySolverCoeffs.D2S1 * s_
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
