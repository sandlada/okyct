/**
 * [Domain Service — module internal]
 * Fast 8-vertex perceptual JND joint-cost quantization within the enclosing 8-bit sRGB cube.
 * Uses 3-bit octant masks, Tone branch-and-bound pruning, and 24-bit bitwise hex packing.
 */

import type { OKYCT, RGB } from '../../models/index.ts'
import { shortestHueDelta } from '../shortest-hue-delta.ts'
import { yToTone } from '../y-to-tone.ts'
import { SrgbByteToLinearLut } from './srgb-lut.ts'

const HueSnapMinChromaForDrift = 0.01
const ToneBudgetStandard = 0.25
const ToneBudgetDark = 0.35
const HueBudgetDeg = 0.48
const WeightTone = 1.0 / (0.25 * 0.25)
const WeightHueArc = 1.0 / (0.0018 * 0.0018)
const WeightChroma = 1.0 / (0.012 * 0.012)
const DegToRad = Math.PI / 180
const RadToDeg = 180 / Math.PI

function byteToOkyctFromTone(r8: number, g8: number, b8: number, y: number, t: number): OKYCT {
  const lr = SrgbByteToLinearLut[r8]
  const lg = SrgbByteToLinearLut[g8]
  const lb = SrgbByteToLinearLut[b8]

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z)

  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_

  let h = Math.atan2(b, a) * RadToDeg
  if (h < 0) h += 360
  return {
    h,
    c: Math.hypot(a, b),
    t,
  }
}

function byteLuminance(r8: number, g8: number, b8: number): number {
  return (
    0.2126729 * SrgbByteToLinearLut[r8] +
    0.7151522 * SrgbByteToLinearLut[g8] +
    0.0721750 * SrgbByteToLinearLut[b8]
  )
}

function scoreCandidate(
  cand: OKYCT,
  referenceHueDeg: number,
  nominalTone: number,
  refChroma: number,
  toneErr: number,
  withinTone: boolean,
  withinFallbackTone: boolean
): { tier: number; cost: number } {
  const hueDeg = cand.c > HueSnapMinChromaForDrift
    ? shortestHueDelta(cand.h, referenceHueDeg)
    : 0
  const withinHue = hueDeg <= HueBudgetDeg
  const tier =
    withinTone && withinHue
      ? 3
      : withinFallbackTone && withinHue
      ? 2
      : withinFallbackTone
      ? 1
      : 0

  const hueArc = cand.c * (hueDeg * DegToRad)
  const chromaErr = cand.c - refChroma
  const cost =
    WeightTone * toneErr * toneErr +
    WeightHueArc * hueArc * hueArc +
    WeightChroma * chromaErr * chromaErr

  return { tier, cost }
}

function hexFromBytes(r: number, g: number, b: number): string {
  const rc = r <= 0 ? 0 : r >= 255 ? 255 : r
  const gc = g <= 0 ? 0 : g >= 255 ? 255 : g
  const bc = b <= 0 ? 0 : b >= 255 ? 255 : b
  return '#' + ((1 << 24) | (rc << 16) | (gc << 8) | bc).toString(16).slice(1)
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

  const baseY = byteLuminance(rRound, gRound, bRound)
  const baseT = yToTone(baseY)
  const baseCandidate = byteToOkyctFromTone(rRound, gRound, bRound, baseY, baseT)
  const refChroma = nominalChroma ?? baseCandidate.c
  if (refChroma < HueSnapMinChromaForDrift && baseCandidate.c < HueSnapMinChromaForDrift) {
    return hexFromBytes(rRound, gRound, bRound)
  }

  const r0 = Math.min(254, Math.floor(rf))
  const g0 = Math.min(254, Math.floor(gf))
  const b0 = Math.min(254, Math.floor(bf))

  const toneBudget = nominalTone < 10 ? ToneBudgetDark : ToneBudgetStandard
  const baseToneErr = Math.abs(baseCandidate.t - nominalTone)
  const baseScore = scoreCandidate(
    baseCandidate,
    referenceHueDeg,
    nominalTone,
    refChroma,
    baseToneErr,
    baseToneErr <= toneBudget,
    baseToneErr <= ToneBudgetDark
  )

  let bestTier = baseScore.tier
  let bestCost = baseScore.cost
  let bestR = rRound
  let bestG = gRound
  let bestB = bRound

  const roundMask = ((rRound - r0) << 2) | ((gRound - g0) << 1) | (bRound - b0)

  for (let mask = 0; mask < 8; mask++) {
    if (mask === roundMask) continue

    const cr = r0 + ((mask >> 2) & 1)
    const cg = g0 + ((mask >> 1) & 1)
    const cb = b0 + (mask & 1)

    const y = byteLuminance(cr, cg, cb)
    const candT = yToTone(y)
    const toneErr = Math.abs(candT - nominalTone)
    const withinTone = toneErr <= toneBudget
    const withinFallbackTone = toneErr <= ToneBudgetDark
    const maxPossibleTier = withinTone ? 3 : withinFallbackTone ? 2 : 0
    if (maxPossibleTier < bestTier) continue

    const cand = byteToOkyctFromTone(cr, cg, cb, y, candT)
    const candScore = scoreCandidate(
      cand,
      referenceHueDeg,
      nominalTone,
      refChroma,
      toneErr,
      withinTone,
      withinFallbackTone
    )

    if (candScore.tier < bestTier) continue
    if (candScore.tier > bestTier || candScore.cost < bestCost) {
      bestTier = candScore.tier
      bestCost = candScore.cost
      bestR = cr
      bestG = cg
      bestB = cb
    }
  }

  return hexFromBytes(bestR, bestG, bestB)
}
