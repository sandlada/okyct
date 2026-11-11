
const CieEpsilon = 216.0 / 24389.0
const CieKappa = 24389.0 / 27.0

export function yToTone(y: number): number {
  const yClamped = Math.max(0, y)
  if (yClamped <= CieEpsilon) {
    return yClamped * CieKappa
  }
  return 116.0 * Math.cbrt(yClamped) - 16.0
}
