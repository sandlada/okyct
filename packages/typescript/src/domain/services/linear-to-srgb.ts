
export function linearToSrgb(c: number): number {
  if (!Number.isFinite(c)) {
    throw new Error(`Invalid linear RGB channel value: ${c}. Expected a finite number.`)
  }
  if (c === 1) return 1
  return c <= 0.0031308 ? 12.92 * c : 1.055 * (Math.pow(Math.max(0, c), 1 / 2.4) - 1) + 1
}
