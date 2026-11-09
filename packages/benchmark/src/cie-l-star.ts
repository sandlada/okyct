/**
 * CIE L* ↔ Y（D65），benchmark 内独立实现，不导入 @sandlada/okyct
 */

export function cieLStarToY(lStar: number): number {
  const l = Math.max(0, Math.min(100, lStar))
  if (l <= 8.0) {
    return l / 903.2962962
  }
  const root = (l + 16) / 116
  return root * root * root
}

export function yToCieLStar(y: number): number {
  const yClamped = Math.max(0, y)
  const eps = 216 / 24389
  const kappa = 24389 / 27
  if (yClamped <= eps) {
    return yClamped * kappa
  }
  return 116 * Math.cbrt(yClamped) - 16
}
