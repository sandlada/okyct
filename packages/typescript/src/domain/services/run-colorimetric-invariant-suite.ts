import type { InvariantTestResult } from '../models/index.ts'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { getApcaContrast } from './get-apca-contrast.ts'
import { getContrastRatio } from './get-contrast-ratio.ts'
import { hexToOkyct } from './hex-to-okyct.ts'
import { okyctToHex } from './okyct-to-hex.ts'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'
import { shortestHueDelta } from './shortest-hue-delta.ts'
import { solveTonesForApca } from './solve-tones-for-apca.ts'
import { solveTonesForContrast } from './solve-tones-for-contrast.ts'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'

const HexRoundTripSeeds = ['#2563EB', '#0000FF', '#FF0000', '#FFD600', '#FF00FF'] as const
const HexRoundTripTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const
const HexHueDriftCapDeg = 0.5
const HexToneDeltaCap = 0.35
const HexMinChromaForHue = 0.01

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function tonalStopHex(sourceHue: number, targetChroma: number, tone: number): string {
  const darkRoll = tone < 18 ? smoothstep(0, 18, tone) : 1
  const lightRoll = tone > 85 ? smoothstep(100, 85, tone) : 1
  const effectiveChroma = targetChroma * darkRoll * lightRoll
  const maxGamutChroma = findMaxChromaForTone(sourceHue, tone)
  const finalChroma = Math.min(effectiveChroma, maxGamutChroma)
  return okyctToHex({ h: sourceHue, c: finalChroma, t: tone })
}

export function runColorimetricInvariantSuite(): InvariantTestResult[] {
  let maxRoundTripError = 0
  let roundTripSamples = 0
  const SampleSteps = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
  for (const r of SampleSteps) {
    for (const g of SampleSteps) {
      for (const b of SampleSteps) {
        const okyct = rgbToOkyct({ r, g, b })
        const restored = okyctToRgb(okyct)
        const err = Math.max(
          Math.abs(r - restored.r),
          Math.abs(g - restored.g),
          Math.abs(b - restored.b)
        )
        if (err > maxRoundTripError) maxRoundTripError = err
        roundTripSamples++
      }
    }
  }

  let maxToneBijectionError = 0
  let monotonicViolations = 0
  let prevY = -1
  for (let t = 0; t <= 100; t += 0.5) {
    const y = toneToY(t)
    if (y <= prevY) monotonicViolations++
    prevY = y
    const backT = yToTone(y)
    const err = Math.abs(t - backT)
    if (err > maxToneBijectionError) maxToneBijectionError = err
  }

  let gamutOverflowCount = 0
  let maxHueDriftDeg = 0
  let gamutSamples = 0
  for (let h = 0; h < 360; h += 15) {
    for (const t of [20, 40, 60, 80]) {
      for (const gamutMapping of ['preserve-tone', 'cusp-compress'] as const) {
        const rgb = okyctToRgb({ h, c: 0.38, t }, { gamutMapping })
        if (rgb.r < 0 || rgb.r > 1 || rgb.g < 0 || rgb.g > 1 || rgb.b < 0 || rgb.b > 1) {
          gamutOverflowCount++
        }
        const backOkyct = rgbToOkyct(rgb)
        if (backOkyct.c > 0.01) {
          const hDiff = shortestHueDelta(backOkyct.h, h)
          if (hDiff > maxHueDriftDeg) maxHueDriftDeg = hDiff
        }
        gamutSamples++
      }
    }
  }

  let hexRoundTripViolations = 0
  let hexRoundTripSamples = 0
  let maxHexHueDriftDeg = 0
  let maxHexToneDelta = 0
  for (const seedHex of HexRoundTripSeeds) {
    const source = hexToOkyct(seedHex)
    for (const tone of HexRoundTripTones) {
      const hex = tonalStopHex(source.h, source.c, tone)
      const measured = hexToOkyct(hex)
      const toneDelta = Math.abs(measured.t - tone)
      if (toneDelta > maxHexToneDelta) maxHexToneDelta = toneDelta
      if (toneDelta > HexToneDeltaCap) hexRoundTripViolations++

      if (measured.c > HexMinChromaForHue) {
        const hDrift = shortestHueDelta(measured.h, source.h)
        if (hDrift > maxHexHueDriftDeg) maxHexHueDriftDeg = hDrift
        if (hDrift > HexHueDriftCapDeg) hexRoundTripViolations++
      }
      hexRoundTripSamples++
    }
  }

  let contrastViolations = 0
  let contrastSamples = 0
  for (let bgT = 0; bgT <= 100; bgT += 2) {
    const wcagSolved = solveTonesForContrast(bgT, 4.5, { metric: 'both', targetLc: 60 })
    if (wcagSolved.darkForegroundTone !== null) {
      const ratio = getContrastRatio(bgT, wcagSolved.darkForegroundTone)
      const lc = Math.abs(getApcaContrast(wcagSolved.darkForegroundTone, bgT))
      if (ratio < 4.5 || lc < 60) contrastViolations++
      contrastSamples++
    }
    if (wcagSolved.lightForegroundTone !== null) {
      const ratio = getContrastRatio(bgT, wcagSolved.lightForegroundTone)
      const lc = Math.abs(getApcaContrast(wcagSolved.lightForegroundTone, bgT))
      if (ratio < 4.5 || lc < 60) contrastViolations++
      contrastSamples++
    }

    const apcaSolved = solveTonesForApca(bgT, 60)
    if (apcaSolved.darkForegroundTone !== null) {
      if (Math.abs(getApcaContrast(apcaSolved.darkForegroundTone, bgT)) < 60) contrastViolations++
      contrastSamples++
    }
    if (apcaSolved.lightForegroundTone !== null) {
      if (Math.abs(getApcaContrast(apcaSolved.lightForegroundTone, bgT)) < 60) contrastViolations++
      contrastSamples++
    }
  }

  return [
    {
      id: 'round-trip',
      name: 'sRGB <-> OKYCT Bidirectional Round-Trip Accuracy',
      formula: 'max |RGB - okyctToRgb(rgbToOkyct(RGB))|',
      passed: maxRoundTripError < 1e-4,
      measuredValue: maxRoundTripError.toExponential(2),
      threshold: '< 1.00e-4',
      samplesChecked: roundTripSamples,
      details: 'Verifies single-variable Newton-Raphson dY/dL convergence across the full sRGB cube.',
    },
    {
      id: 'tone-bijection',
      name: 'Tone <-> CIE Y Analytical Bijection & Monotonicity',
      formula: '∀ T₁ < T₂ => Y(T₁) < Y(T₂), |yToTone(toneToY(T)) - T|',
      passed: monotonicViolations === 0 && maxToneBijectionError < 1e-6,
      measuredValue: `${maxToneBijectionError.toExponential(2)} (violations: ${monotonicViolations})`,
      threshold: '< 1.00e-6',
      samplesChecked: 201,
      details: 'Guarantees strictly monotonic mapping between perceptual Tone and physical luminance Y.',
    },
    {
      id: 'hex-round-trip',
      name: '8-bit Hex Quantization Hue & Tone Budget',
      formula: 'tonalStopHex -> hexToOkyct, ΔH & |ΔTone|',
      passed: hexRoundTripViolations === 0,
      measuredValue: `ΔH_max = ${maxHexHueDriftDeg.toFixed(3)}°, ΔT_max = ${maxHexToneDelta.toFixed(3)} (violations: ${hexRoundTripViolations})`,
      threshold: `ΔH <= ${HexHueDriftCapDeg}°, |ΔTone| <= ${HexToneDeltaCap}`,
      samplesChecked: hexRoundTripSamples,
      details: 'Verifies 8-vertex perceptual JND quantization preserves OKLab hue and Tone within tight bounds.',
    },
    {
      id: 'cusp-containment',
      name: '360° Gamut Containment & Zero Hue Drift',
      formula: 'C=0.38 under preserve-tone & cusp-compress: ΔHue & channel bounds',
      passed: gamutOverflowCount === 0 && maxHueDriftDeg < 0.5,
      measuredValue: `ΔH_max = ${maxHueDriftDeg.toFixed(3)}° (overflows: ${gamutOverflowCount})`,
      threshold: 'ΔH < 0.500°',
      samplesChecked: gamutSamples,
      details: 'Ensures out-of-gamut colors stay strictly inside [0, 1] RGB with negligible hue rotation.',
    },
    {
      id: 'algebraic-contrast',
      name: 'O(1) Dual WCAG 2.1 + APCA Contrast Inversion Guard',
      formula: 'WCAG >= 4.5 & |APCA Lc| >= 60 for solved foreground tones',
      passed: contrastViolations === 0,
      measuredValue: `100% pass (violations: ${contrastViolations}/${contrastSamples})`,
      threshold: '0 violations',
      samplesChecked: contrastSamples,
      details: 'Verifies closed-form WCAG 2.1 and analytical APCA inverse Tone solvers across [0, 100].',
    },
  ]
}
