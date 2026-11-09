
export function yToTone(y: number): number {
  const yClamped = Math.max(0, y)
  const eps = 216.0 / 24389.0
  const kappa = 24389.0 / 27.0
  if (yClamped <= eps) {
    return yClamped * kappa
  }
  return 116.0 * Math.cbrt(yClamped) - 16.0
}
