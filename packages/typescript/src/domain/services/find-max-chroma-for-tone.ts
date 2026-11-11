
import { isInSrgbGamut } from './is-in-srgb-gamut.ts'

export function findMaxChromaForTone(h: number, t: number): number {
  if (t <= 0.001 || t >= 99.999) return 0

  let low = 0
  let high = 0.45
  for (let i = 0; i < 18; i++) {
    const mid = (low + high) / 2
    if (isInSrgbGamut(h, mid, t).inGamut) {
      low = mid
    } else {
      high = mid
    }
  }
  return low
}
