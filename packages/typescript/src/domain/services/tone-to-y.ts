
const CieKappa = 24389.0 / 27.0

export function toneToY(tone: number): number {
  if (!Number.isFinite(tone)) {
    throw new Error(`Invalid tone value: ${tone}. Expected a finite number in [0, 100].`)
  }
  if (tone <= 0) return 0
  if (tone >= 100) return 1
  if (tone <= 8.0) {
    return tone / CieKappa
  }
  const yRoot = (tone + 16.0) / 116.0
  return yRoot * yRoot * yRoot
}
