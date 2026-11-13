
const CieEpsilon = 216.0 / 24389.0
const CieKappa = 24389.0 / 27.0

export function yToTone(y: number): number {
  if (!Number.isFinite(y)) {
    throw new Error(`Invalid relative luminance Y: ${y}. Expected a finite number.`)
  }
  const yClamped = Math.max(0, Math.min(1, y))
  if (yClamped <= CieEpsilon) {
    return yClamped * CieKappa
  }
  return Math.min(100, 116.0 * Math.cbrt(yClamped) - 16.0)
}
