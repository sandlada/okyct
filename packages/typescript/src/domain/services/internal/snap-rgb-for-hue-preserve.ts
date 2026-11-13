/**
 * [Domain Service — module internal]
 * Fast 8-vertex perceptual JND joint-cost quantization within the enclosing 8-bit sRGB cube.
 * Minimizes Tone drift and chroma-weighted Hue arc error simultaneously using an sRGB LUT.
 */

import type { OKYCT, RGB } from '../../models/index.ts'
import { rgbToHex } from '../rgb-to-hex.ts'
import { shortestHueDelta } from '../shortest-hue-delta.ts'
import { yToTone } from '../y-to-tone.ts'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { SrgbByteToLinearLut } from './srgb-lut.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

const HueSnapMinChromaForDrift = 0.01
const ToneBudgetStandard = 0.25
const ToneBudgetDark = 0.35
const HueBudgetDeg = 0.48
const WeightTone = 1.0 / (0.25 * 0.25)
const WeightHueArc = 1.0 / (0.0018 * 0.0018)
const WeightChroma = 1.0 / (0.012 * 0.012)

function byteToOkyctFast(r8: number, g8: number, b8: number): OKYCT {
  const linear: RGB = {
    r: SrgbByteToLinearLut[r8],
    g: SrgbByteToLinearLut[g8],
    b: SrgbByteToLinearLut[b8],
  }
  const xyz = linearRgbToXyz(linear)
  const oklab = xyzToOklab(xyz)
  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI
  if (h < 0) h += 360
  return {
    h,
    c: Math.hypot(oklab.a, oklab.b),
    t: yToTone(xyz.y),
  }
}

function hexFromBytes(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')
  )
}

export function snapRgbToHexForHuePreserve(
  rgb: RGB,
  referenceHueDeg: number,
  nominalTone: number,
  nominalChroma?: number
): string {
  if (nominalTone <= 0.001) return '#000000'
  if (nominalTone >= 99.999) return '#ffffff'

  const rf = Math.max(0, Math.min(255, rgb.r * 255))
  const gf = Math.max(0, Math.min(255, rgb.g * 255))
  const bf = Math.max(0, Math.min(255, rgb.b * 255))

  const rRound = Math.round(rf)
  const gRound = Math.round(gf)
  const bRound = Math.round(bf)

  if (nominalChroma !== undefined && nominalChroma < HueSnapMinChromaForDrift) {
    return hexFromBytes(rRound, gRound, bRound)
  }

  const baseCandidate = byteToOkyctFast(rRound, gRound, bRound)
  const refChroma = nominalChroma ?? baseCandidate.c
  if (refChroma < HueSnapMinChromaForDrift && baseCandidate.c < HueSnapMinChromaForDrift) {
    return hexFromBytes(rRound, gRound, bRound)
  }

  const r0 = Math.min(254, Math.floor(rf))
  const g0 = Math.min(254, Math.floor(gf))
  const b0 = Math.min(254, Math.floor(bf))

  const toneBudget = nominalTone < 10 ? ToneBudgetDark : ToneBudgetStandard
  let bestHex = rgbToHex(rgb)
  let bestTier = 0
  let bestCost = Infinity

  for (let dr = 0; dr <= 1; dr++) {
    for (let dg = 0; dg <= 1; dg++) {
      for (let db = 0; db <= 1; db++) {
        const cr = r0 + dr
        const cg = g0 + dg
        const cb = b0 + db
        const cand = byteToOkyctFast(cr, cg, cb)

        const toneErr = Math.abs(cand.t - nominalTone)
        const hueDeg = cand.c > HueSnapMinChromaForDrift
          ? shortestHueDelta(cand.h, referenceHueDeg)
          : 0

        const withinTone = toneErr <= toneBudget
        const withinFallbackTone = toneErr <= ToneBudgetDark
        const withinHue = hueDeg <= HueBudgetDeg
        const tier =
          withinTone && withinHue
            ? 3
            : withinFallbackTone && withinHue
            ? 2
            : withinFallbackTone
            ? 1
            : 0

        if (tier < bestTier) continue

        const hueArc = cand.c * ((hueDeg * Math.PI) / 180)
        const chromaErr = cand.c - refChroma
        const cost =
          WeightTone * toneErr * toneErr +
          WeightHueArc * hueArc * hueArc +
          WeightChroma * chromaErr * chromaErr

        if (tier > bestTier || cost < bestCost) {
          bestTier = tier
          bestCost = cost
          bestHex = hexFromBytes(cr, cg, cb)
        }
      }
    }
  }

  return bestHex
}
