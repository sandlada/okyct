import {
  GamutMappingModes,
  GamutTargets,
  type ColorConversionOptions,
  type OKYCT,
  type RGB,
} from '../models/index.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { linearToSrgb } from './linear-to-srgb.ts'
import { toneToY } from './tone-to-y.ts'
import { compressToGamutCusp } from './internal/compress-to-gamut-cusp.ts'
import { evalLinearGamutMargin } from './internal/eval-linear-gamut-margin.ts'

const GamutTolerance = 1e-5

function clampUnitRgb(linear: RGB): RGB {
  return {
    r: Math.max(0, Math.min(1, linearToSrgb(linear.r))),
    g: Math.max(0, Math.min(1, linearToSrgb(linear.g))),
    b: Math.max(0, Math.min(1, linearToSrgb(linear.b))),
  }
}

export function okyctToRgb(okyct: OKYCT, options: ColorConversionOptions = {}): RGB {
  if (okyct === null || typeof okyct !== 'object') {
    throw new Error('Invalid OKYCT input: expected an object with h, c, and t fields.')
  }
  const { h, c, t } = okyct
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(c) ||
    !Number.isFinite(t) ||
    c < 0 ||
    t < 0 ||
    t > 100
  ) {
    throw new Error(
      `Invalid OKYCT coordinates: h=${h}, c=${c}, t=${t}. Expected finite h, c >= 0, and t in [0, 100].`
    )
  }

  const gamut = options.gamut ?? 'srgb'
  if (!GamutTargets.includes(gamut)) {
    throw new Error(`Invalid gamut target: "${String(gamut)}". Expected one of: ${GamutTargets.join(', ')}.`)
  }
  const gamutMapping = options.gamutMapping ?? 'preserve-tone'
  if (!GamutMappingModes.includes(gamutMapping)) {
    throw new Error(
      `Invalid gamutMapping mode: "${String(gamutMapping)}". Expected one of: ${GamutMappingModes.join(', ')}.`
    )
  }

  if (t <= 0.001) return { r: 0, g: 0, b: 0 }
  if (t >= 99.999) return { r: 1, g: 1, b: 1 }

  const targetY = toneToY(t)
  const rad = (h * Math.PI) / 180
  const cosH = Math.cos(rad)
  const sinH = Math.sin(rad)

  const check = evalLinearGamutMargin(targetY, c * cosH, c * sinH, gamut)
  if (check.margin >= -GamutTolerance) {
    return clampUnitRgb(check.linear)
  }

  if (gamutMapping === 'cusp-compress') {
    return clampUnitRgb(compressToGamutCusp(h, c, t, gamut))
  }

  const maxC = findMaxChromaForTone(h, t, { gamut })
  const safe = evalLinearGamutMargin(targetY, maxC * cosH, maxC * sinH, gamut, check.L)
  return clampUnitRgb(safe.linear)
}
