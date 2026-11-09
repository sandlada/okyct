/**
 * [Domain Service — module internal]
 * 单变量牛顿切线法求 OKLab L（固定 a,b）
 */

export function solveOklabLForTargetY(targetY: number, a: number, b: number): number {
  if (targetY <= 0) return 0
  if (targetY >= 1.0) return 1.0

  let L = Math.cbrt(targetY)

  for (let i = 0; i < 7; i++) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b

    const l3 = l_ * l_ * l_
    const m3 = m_ * m_ * m_
    const s3 = s_ * s_ * s_

    const currentY = -0.0405801784 * l3 + 1.1122568696 * m3 - 0.0716766787 * s3
    const diff = currentY - targetY
    if (Math.abs(diff) < 1e-6) break

    const dl3_dL = 3 * l_ * l_
    const dm3_dL = 3 * m_ * m_
    const ds3_dL = 3 * s_ * s_
    const dY_dL = -0.0405801784 * dl3_dL + 1.1122568696 * dm3_dL - 0.0716766787 * ds3_dL

    if (Math.abs(dY_dL) < 1e-8) break
    L = L - diff / dY_dL
    L = Math.max(0, Math.min(1.0, L))
  }

  return L
}
