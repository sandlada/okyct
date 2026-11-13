
import { isInSrgbGamut } from './is-in-srgb-gamut.ts'

export function findMaxChromaForTone(h: number, t: number): number {
  if (!Number.isFinite(h) || !Number.isFinite(t) || t < 0 || t > 100) {
    throw new Error(`Invalid hue/tone coordinates: h=${h}, t=${t}. Expected finite h and t in [0, 100].`)
  }
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
