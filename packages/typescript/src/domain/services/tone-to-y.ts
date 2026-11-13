
const CieKappa = 24389.0 / 27.0

export function toneToY(tone: number): number {
  if (!Number.isFinite(tone)) {
    throw new Error(`Invalid tone value: ${tone}. Expected a finite number in [0, 100].`)
  }
  const t = Math.max(0, Math.min(100, tone))
  if (t <= 8.0) {
    return t / CieKappa
  }
  const yRoot = (t + 16.0) / 116.0
  return yRoot * yRoot * yRoot
}
