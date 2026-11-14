import { computeColorEmissiveTelemetry } from '../../color/emissive.ts'
import {
  findMaxChromaForTone,
  getContrastRatio,
  getDeltaE2000,
  hexToOkyct,
  okyctToHex,
  shortestHueDelta,
  simulateCvd,
  solveTonesForContrast,
} from '../../color/math.ts'

export type HueFamilyId =
  | 'neutral'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink'

export type TemperatureId = 'warm' | 'cool' | 'neutral'
export type VividnessLevel = 'muted' | 'soft' | 'vivid' | 'intense'
export type LightnessLevel = 'very-dark' | 'dark' | 'medium' | 'light' | 'very-light'
export type ScreenComfortLevel = 'power-saving' | 'balanced' | 'bright-intense'

export interface PlainColorProfile {
  hex: string
  hue: number
  chroma: number
  tone: number
  maxChromaAtTone: number
  hueFamily: HueFamilyId
  temperature: TemperatureId
  vividnessPct: number
  vividnessLevel: VividnessLevel
  lightnessPct: number
  lightnessLevel: LightnessLevel
  screenComfort: ScreenComfortLevel
  isBlueHeavy: boolean
  isNearPureBlack: boolean
}

export type ReadabilityGrade = 'great' | 'large-only' | 'poor'

export interface ReadabilityReport {
  fgHex: string
  bgHex: string
  contrastRatio: number
  grade: ReadabilityGrade
  cvdSafe: boolean
  suggestedFgHex: string | null
  suggestedContrastRatio: number | null
}

export type SimilarityBand =
  | 'identical'
  | 'very-close'
  | 'same-family'
  | 'distinct'
  | 'strong-contrast'

export type BrightnessDiffKind = 'same' | 'a-brighter' | 'b-brighter'
export type VividnessDiffKind = 'same' | 'a-more-vivid' | 'b-more-vivid'
export type HueDiffKind = 'same' | 'slight' | 'different'

export interface PlainColorComparison {
  hexA: string
  hexB: string
  deltaE2000: number
  band: SimilarityBand
  brightnessDiff: BrightnessDiffKind
  vividnessDiff: VividnessDiffKind
  hueDiff: HueDiffKind
  cvdDistinct: boolean
}

const MaxVisualChromaRef = 0.28

export function normalizeHexInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  const shortMatch = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(trimmed)
  if (shortMatch) {
    const [, r, g, b] = shortMatch
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return null
}

function classifyHueFamily(hue: number, chroma: number): { family: HueFamilyId; temperature: TemperatureId } {
  if (chroma < 0.025) {
    return { family: 'neutral', temperature: 'neutral' }
  }
  const h = ((hue % 360) + 360) % 360
  if (h < 18 || h >= 342) return { family: 'red', temperature: 'warm' }
  if (h < 58) return { family: 'orange', temperature: 'warm' }
  if (h < 108) return { family: 'yellow', temperature: 'warm' }
  if (h < 162) return { family: 'green', temperature: 'cool' }
  if (h < 212) return { family: 'teal', temperature: 'cool' }
  if (h < 275) return { family: 'blue', temperature: 'cool' }
  if (h < 318) return { family: 'purple', temperature: 'cool' }
  return { family: 'pink', temperature: 'warm' }
}

function classifyVividness(pct: number): VividnessLevel {
  if (pct < 18) return 'muted'
  if (pct < 45) return 'soft'
  if (pct < 75) return 'vivid'
  return 'intense'
}

function classifyLightness(tone: number): LightnessLevel {
  if (tone < 18) return 'very-dark'
  if (tone < 40) return 'dark'
  if (tone < 65) return 'medium'
  if (tone < 86) return 'light'
  return 'very-light'
}

export function describeColorInPlainLanguage(hex: string): PlainColorProfile {
  const { h, c, t } = hexToOkyct(hex)
  const maxChromaAtTone = findMaxChromaForTone(h, Math.max(0.5, Math.min(99.5, t)))
  const { family, temperature } = classifyHueFamily(h, c)

  const vividnessPct = Math.round(Math.min(100, (c / MaxVisualChromaRef) * 100))
  const lightnessPct = Math.round(t)

  const telemetry = computeColorEmissiveTelemetry(hex)
  let screenComfort: ScreenComfortLevel = 'balanced'
  if (telemetry.aplPercent < 28 && telemetry.blueStressIndex < 45) {
    screenComfort = 'power-saving'
  } else if (vividnessPct >= 75 || telemetry.aplPercent > 75 || telemetry.blueStressIndex > 65) {
    screenComfort = 'bright-intense'
  }

  return {
    hex: hex.toUpperCase(),
    hue: h,
    chroma: c,
    tone: t,
    maxChromaAtTone,
    hueFamily: family,
    temperature,
    vividnessPct,
    vividnessLevel: classifyVividness(vividnessPct),
    lightnessPct,
    lightnessLevel: classifyLightness(t),
    screenComfort,
    isBlueHeavy: telemetry.blueStressIndex >= 60,
    isNearPureBlack: t < 3,
  }
}

export function evaluateReadability(fgHex: string, bgHex: string): ReadabilityReport {
  const contrastRatio = getContrastRatio(fgHex, bgHex)
  let grade: ReadabilityGrade = 'poor'
  if (contrastRatio >= 4.5) {
    grade = 'great'
  } else if (contrastRatio >= 3.0) {
    grade = 'large-only'
  }

  const fgCvd = simulateCvd(fgHex, 'deuteranopia')
  const bgCvd = simulateCvd(bgHex, 'deuteranopia')
  const cvdContrast = getContrastRatio(fgCvd, bgCvd)
  const cvdSafe = cvdContrast >= 3.0

  let suggestedFgHex: string | null = null
  let suggestedContrastRatio: number | null = null

  if (grade !== 'great') {
    const fgOkyct = hexToOkyct(fgHex)
    const solution = solveTonesForContrast(bgHex, 4.6)
    const candidates: string[] = []
    if (solution.darkForegroundTone !== null) {
      candidates.push(okyctToHex({ h: fgOkyct.h, c: fgOkyct.c, t: solution.darkForegroundTone }))
    }
    if (solution.lightForegroundTone !== null) {
      candidates.push(okyctToHex({ h: fgOkyct.h, c: fgOkyct.c, t: solution.lightForegroundTone }))
    }

    let bestHex: string | null = null
    let bestToneDist = Infinity
    for (const candidate of candidates) {
      const candidateRatio = getContrastRatio(candidate, bgHex)
      if (candidateRatio < 4.5) continue
      const candidateTone = hexToOkyct(candidate).t
      const dist = Math.abs(candidateTone - fgOkyct.t)
      if (dist < bestToneDist) {
        bestToneDist = dist
        bestHex = candidate
      }
    }

    if (bestHex !== null) {
      suggestedFgHex = bestHex.toUpperCase()
      suggestedContrastRatio = getContrastRatio(bestHex, bgHex)
    }
  }

  return {
    fgHex: fgHex.toUpperCase(),
    bgHex: bgHex.toUpperCase(),
    contrastRatio,
    grade,
    cvdSafe,
    suggestedFgHex,
    suggestedContrastRatio,
  }
}

export function compareTwoColorsPlainly(hexA: string, hexB: string): PlainColorComparison {
  const deltaE2000 = getDeltaE2000(hexA, hexB)
  let band: SimilarityBand = 'strong-contrast'
  if (deltaE2000 < 1.0) {
    band = 'identical'
  } else if (deltaE2000 < 2.5) {
    band = 'very-close'
  } else if (deltaE2000 < 6.0) {
    band = 'same-family'
  } else if (deltaE2000 < 15.0) {
    band = 'distinct'
  }

  const a = hexToOkyct(hexA)
  const b = hexToOkyct(hexB)

  const toneDiff = a.t - b.t
  let brightnessDiff: BrightnessDiffKind = 'same'
  if (toneDiff > 5) brightnessDiff = 'a-brighter'
  else if (toneDiff < -5) brightnessDiff = 'b-brighter'

  const chromaDiff = a.c - b.c
  let vividnessDiff: VividnessDiffKind = 'same'
  if (chromaDiff > 0.025) vividnessDiff = 'a-more-vivid'
  else if (chromaDiff < -0.025) vividnessDiff = 'b-more-vivid'

  const hueDeltaAbs = Math.abs(shortestHueDelta(a.h, b.h))
  let hueDiff: HueDiffKind = 'same'
  if (a.c > 0.02 && b.c > 0.02) {
    if (hueDeltaAbs > 28) hueDiff = 'different'
    else if (hueDeltaAbs > 8) hueDiff = 'slight'
  }

  const cvdA = simulateCvd(hexA, 'deuteranopia')
  const cvdB = simulateCvd(hexB, 'deuteranopia')
  const cvdDistinct = getDeltaE2000(cvdA, cvdB) >= 4.0

  return {
    hexA: hexA.toUpperCase(),
    hexB: hexB.toUpperCase(),
    deltaE2000,
    band,
    brightnessDiff,
    vividnessDiff,
    hueDiff,
    cvdDistinct,
  }
}
