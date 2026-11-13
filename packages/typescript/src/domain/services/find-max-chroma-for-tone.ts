import { GamutTargets, type GamutTarget } from '../models/index.ts'
import { toneToY } from './tone-to-y.ts'
import { evalLinearGamutMargin } from './internal/eval-linear-gamut-margin.ts'

const GamutSearchMarginTolerance = 1e-6

export function findMaxChromaForTone(
  h: number,
  t: number,
  options: { gamut?: GamutTarget } = {}
): number {
  const gamut = options.gamut ?? 'srgb'
  if (!GamutTargets.includes(gamut)) {
    throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
  }
  if (!Number.isFinite(h) || !Number.isFinite(t) || t < 0 || t > 100) {
    throw new Error(`Invalid hue/tone coordinates: h=${h}, t=${t}. Expected finite h and t in [0, 100].`)
  }
  if (t <= 0.001 || t >= 99.999) return 0

  const targetY = toneToY(t)
  const rad = (h * Math.PI) / 180
  const cosH = Math.cos(rad)
  const sinH = Math.sin(rad)

  let low = 0
  let high = gamut === 'display-p3' ? 0.50 : 0.38
  let lastL = Math.cbrt(targetY)
  let fLow = Math.min(targetY, 1 - targetY)
  let fHigh = NaN

  for (let i = 0; i < 6; i++) {
    const mid = (low + high) * 0.5
    const ev = evalLinearGamutMargin(targetY, mid * cosH, mid * sinH, gamut, lastL)
    if (ev.margin >= -GamutSearchMarginTolerance) {
      low = mid
      fLow = ev.margin
      lastL = ev.L
    } else {
      high = mid
      fHigh = ev.margin
    }
  }

  if (Number.isNaN(fHigh)) {
    fHigh = evalLinearGamutMargin(targetY, high * cosH, high * sinH, gamut, lastL).margin
  }

  let side = 0
  for (let i = 0; i < 8; i++) {
    if (high - low < 1e-6) break
    const denom = fHigh - fLow
    let x = Math.abs(denom) > 1e-12 ? (low * fHigh - high * fLow) / denom : (low + high) * 0.5
    if (!(x > low && x < high)) x = (low + high) * 0.5

    const ev = evalLinearGamutMargin(targetY, x * cosH, x * sinH, gamut, lastL)
    if (Math.abs(ev.margin) <= GamutSearchMarginTolerance) {
      low = x
      break
    }
    if (ev.margin > 0) {
      low = x
      fLow = ev.margin
      lastL = ev.L
      if (side === -1) fHigh *= 0.5
      side = -1
    } else {
      high = x
      fHigh = ev.margin
      if (side === 1) fLow *= 0.5
      side = 1
    }
  }

  return low
}
