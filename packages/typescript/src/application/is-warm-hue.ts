
export function isWarmHue(hue: number): boolean {
  if (!Number.isFinite(hue)) {
    throw new Error(`Invalid hue value: ${hue}. Expected a finite number.`)
  }
  const normalized = ((hue % 360) + 360) % 360
  return (normalized >= 20 && normalized <= 110) || normalized >= 340
}
