
const CieEpsilon = 216.0 / 24389.0
const CieKappa = 24389.0 / 27.0

export function yToTone(y: number): number {
  if (!Number.isFinite(y)) {
    throw new Error(`Invalid relative luminance Y: ${y}. Expected a finite number.`)
  }
  if (y <= 0) return 0
  if (y >= 1) return 100
  if (y <= CieEpsilon) {
    return y * CieKappa
  }
  return Math.min(100, 116.0 * Math.cbrt(y) - 16.0)
}
