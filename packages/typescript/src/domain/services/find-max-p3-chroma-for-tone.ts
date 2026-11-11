
import { isInDisplayP3Gamut } from './is-in-display-p3-gamut.ts'

export function findMaxP3ChromaForTone(h: number, t: number): number {
  if (t <= 0.001 || t >= 99.999) return 0

  let low = 0
  let high = 0.5
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2
    if (isInDisplayP3Gamut(h, mid, t).inGamut) {
      low = mid
    } else {
      high = mid
    }
  }
  return low
}
