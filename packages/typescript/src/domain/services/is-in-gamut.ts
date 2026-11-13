import {
  GamutTargets,
  type GamutCheckResult,
  type GamutTarget,
  type OKYCT,
  type RGB,
} from '../models/index.ts'
import { linearToSrgb } from './linear-to-srgb.ts'
import { toneToY } from './tone-to-y.ts'
import { evalLinearGamutMargin } from './internal/eval-linear-gamut-margin.ts'

const GamutTolerance = 1e-5

export function isInGamut(
  okyct: OKYCT,
  options: { gamut?: GamutTarget } = {}
): GamutCheckResult {
  if (okyct === null || typeof okyct !== 'object') {
    throw new Error('Invalid OKYCT input: expected an object with h, c, and t fields.')
  }
  const { h, c, t } = okyct
  const gamut = options.gamut ?? 'srgb'
  if (!GamutTargets.includes(gamut)) {
    throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
  }
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(c) ||
    !Number.isFinite(t) ||
    c < 0 ||
    t < 0 ||
    t > 100
  ) {
    throw new Error(
      `Invalid OKYCT coordinates for gamut check: h=${h}, c=${c}, t=${t}. Expected finite h, c >= 0, and t in [0, 100].`
    )
  }

  if (t <= 0.001) return { inGamut: true, rgb: { r: 0, g: 0, b: 0 } }
  if (t >= 99.999) return { inGamut: true, rgb: { r: 1, g: 1, b: 1 } }

  const targetY = toneToY(t)
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)

  const ev = evalLinearGamutMargin(targetY, a, b, gamut)
  const rgb: RGB = {
    r: linearToSrgb(ev.linear.r),
    g: linearToSrgb(ev.linear.g),
    b: linearToSrgb(ev.linear.b),
  }

  return {
    inGamut: ev.margin >= -GamutTolerance,
    rgb,
  }
}
