import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store.ts'
import { simulateCvd } from '../../color/benchmark.ts'
import {
  applyEmissiveProfileToTokenHex,
  computeColorEmissiveTelemetry,
  type ColorEmissiveTelemetry,
  type EmissivePanelType,
} from '../../color/emissive.ts'
import {
  findMaxChromaForTone,
  getApcaContrast,
  getContrastRatio,
  getDeltaE2000,
  getDeltaEOklab,
  hexToOkyct,
  hexToRgb,
  isInSrgbGamut,
  shortestHueDelta,
  toneToY,
} from '../../color/math.ts'
import { StandardTones, TonalPalette, type PaletteSet } from '../../color/palettes.ts'
import { selectCustomLight, selectPalettes } from '../studio/selectors.ts'
import type { DeltaPaletteKey, DeltaScaleSourceKind } from './slice.ts'

const HexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export interface ResolvedScaleStep {
  readonly index: number
  readonly label: string
  readonly rawHex: string
  readonly effectiveHex: string
}

export interface ResolvedScalePayload {
  readonly steps: readonly ResolvedScaleStep[]
  readonly invalidTokens: readonly string[]
}

export interface StepAdjacentDelta {
  readonly fromLabel: string
  readonly toLabel: string
  readonly deltaT: number
  readonly deltaC: number
  readonly deltaH: number
  readonly deltaEOk: number
  readonly deltaE2000: number
}

export interface StepCoreMetrics {
  readonly index: number
  readonly label: string
  readonly rawHex: string
  readonly hex: string
  readonly swatchHex: string
  readonly rgb255: { readonly r: number; readonly g: number; readonly b: number }
  readonly okyct: { readonly h: number; readonly c: number; readonly t: number }
  readonly cieY: number
  readonly inSrgbGamut: boolean
  readonly maxSrgbChroma: number
  readonly chromaUtilization: number
  readonly deltaFromPrev: StepAdjacentDelta | null
  readonly telemetry: ColorEmissiveTelemetry
}

export interface DeltaScaleSummary {
  readonly stepCount: number
  readonly transitionCount: number
  readonly meanDeltaE2000: number
  readonly minDeltaE2000: number
  readonly maxDeltaE2000: number
  readonly stdDevDeltaE2000: number
  readonly meanDeltaEOk: number
  readonly maxDeltaEOk: number
  readonly maxAbsDeltaH: number
  readonly meanToneStep: number
  readonly meanPowerMw: number
  readonly peakBlueStress: number
}

export interface ScaleCoreAnalysis {
  readonly steps: readonly StepCoreMetrics[]
  readonly invalidTokens: readonly string[]
  readonly summary: DeltaScaleSummary
}

export interface StepContrastRow {
  readonly index: number
  readonly label: string
  readonly hex: string
  readonly swatchHex: string
  readonly tone: number
  readonly wcagVsWhite: number
  readonly wcagVsBlack: number
  readonly wcagVsRef: number
  readonly apcaVsWhite: number
  readonly apcaVsBlack: number
  readonly apcaVsRef: number
}

export interface ScalePairComparisonRow {
  readonly index: number
  readonly labelA: string
  readonly labelB: string
  readonly hexA: string
  readonly hexB: string
  readonly swatchA: string
  readonly swatchB: string
  readonly deltaE2000: number
  readonly deltaEOk: number
  readonly deltaT: number
  readonly deltaC: number
  readonly deltaH: number
  readonly wcagBetweenAB: number
  readonly apcaBetweenAB: number
  readonly powerDeltaMw: number
}

function normalizeHexCandidate(token: string): string {
  const trimmed = token.trim()
  if (trimmed === '') return ''
  if (trimmed.startsWith('#')) return trimmed
  if (/^(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
    return `#${trimmed}`
  }
  return trimmed
}

function parseManualHexList(input: string): {
  readonly validHexes: readonly string[]
  readonly invalidTokens: readonly string[]
} {
  const rawTokens = input
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  const validHexes: string[] = []
  const invalidTokens: string[] = []

  for (const token of rawTokens) {
    const candidate = normalizeHexCandidate(token)
    if (HexColorPattern.test(candidate)) {
      validHexes.push(candidate.toUpperCase())
    } else {
      invalidTokens.push(token)
    }
  }

  return { validHexes, invalidTokens }
}

function resolveScaleSteps(
  source: DeltaScaleSourceKind,
  customId: string,
  manualInput: string,
  palettes: PaletteSet,
  customColors: ReturnType<typeof selectCustomLight>,
  applyEmissive: boolean,
  emissiveOpts: {
    profile: EmissivePanelType
    burnInGuard: boolean
    antiFringing: boolean
  },
): ResolvedScalePayload {
  const transform = (rawHex: string, toneHint: number): string => {
    if (!applyEmissive) return rawHex.toUpperCase()
    const roleKey = toneHint <= 4 ? 'surfaceLowest' : 'token'
    return applyEmissiveProfileToTokenHex(roleKey, rawHex, emissiveOpts).toUpperCase()
  }

  if (source === 'manual') {
    const { validHexes, invalidTokens } = parseManualHexList(manualInput)
    const steps: ResolvedScaleStep[] = validHexes.map((hex, index) => {
      const tone = hexToOkyct(hex).t
      return {
        index,
        label: `#${index + 1}`,
        rawHex: hex,
        effectiveHex: transform(hex, tone),
      }
    })
    return { steps, invalidTokens }
  }

  if (source === 'custom-palette') {
    const matched = customColors.find((item) => item.id === customId) ?? customColors[0]
    if (matched) {
      const palette = TonalPalette.fromHex(matched.harmonizedHex)
      const steps: ResolvedScaleStep[] = StandardTones.map((tone, index) => {
        const rawHex = palette.tone(tone).toUpperCase()
        return {
          index,
          label: `T${tone}`,
          rawHex,
          effectiveHex: transform(rawHex, tone),
        }
      })
      return { steps, invalidTokens: [] }
    }
  }

  const paletteKey: DeltaPaletteKey =
    source === 'custom-palette' ? 'primary' : source
  const palette = palettes[paletteKey]
  const steps: ResolvedScaleStep[] = StandardTones.map((tone, index) => {
    const rawHex = palette.tone(tone).toUpperCase()
    return {
      index,
      label: `T${tone}`,
      rawHex,
      effectiveHex: transform(rawHex, tone),
    }
  })

  return { steps, invalidTokens: [] }
}

function analyzeScaleCore(
  resolved: ResolvedScalePayload,
  cvdType: RootState['studio']['cvdType'],
): ScaleCoreAnalysis {
  const steps: StepCoreMetrics[] = []
  const deltaE2000List: number[] = []
  const deltaEOkList: number[] = []
  const deltaTAbsList: number[] = []
  let maxAbsDeltaH = 0
  let powerSum = 0
  let peakBlueStress = 0

  for (let i = 0; i < resolved.steps.length; i++) {
    const item = resolved.steps[i]
    const hex = item.effectiveHex
    const rgb = hexToRgb(hex)
    const okyct = hexToOkyct(hex)
    const cieY = toneToY(okyct.t)
    const inGamut = isInSrgbGamut(okyct).inGamut
    const maxSrgbChroma = findMaxChromaForTone(okyct.h, okyct.t, { gamut: 'srgb' })
    const chromaUtilization = maxSrgbChroma > 1e-6 ? okyct.c / maxSrgbChroma : 0
    const telemetry = computeColorEmissiveTelemetry(hex)

    powerSum += telemetry.powerMw
    if (telemetry.blueStressIndex > peakBlueStress) {
      peakBlueStress = telemetry.blueStressIndex
    }

    let deltaFromPrev: StepAdjacentDelta | null = null
    if (i > 0) {
      const prev = steps[i - 1]
      const dT = okyct.t - prev.okyct.t
      const dC = okyct.c - prev.okyct.c
      const dH = shortestHueDelta(prev.okyct.h, okyct.h)
      const dEOk = getDeltaEOklab(prev.hex, hex)
      const dE2000 = getDeltaE2000(prev.hex, hex)

      deltaE2000List.push(dE2000)
      deltaEOkList.push(dEOk)
      deltaTAbsList.push(Math.abs(dT))
      if (Math.abs(dH) > maxAbsDeltaH) {
        maxAbsDeltaH = Math.abs(dH)
      }

      deltaFromPrev = {
        fromLabel: prev.label,
        toLabel: item.label,
        deltaT: dT,
        deltaC: dC,
        deltaH: dH,
        deltaEOk: dEOk,
        deltaE2000: dE2000,
      }
    }

    steps.push({
      index: item.index,
      label: item.label,
      rawHex: item.rawHex,
      hex,
      swatchHex: simulateCvd(hex, cvdType),
      rgb255: {
        r: Math.round(rgb.r * 255),
        g: Math.round(rgb.g * 255),
        b: Math.round(rgb.b * 255),
      },
      okyct,
      cieY,
      inSrgbGamut: inGamut,
      maxSrgbChroma,
      chromaUtilization,
      deltaFromPrev,
      telemetry,
    })
  }

  const transitionCount = deltaE2000List.length
  const meanDeltaE2000 =
    transitionCount > 0
      ? deltaE2000List.reduce((acc, v) => acc + v, 0) / transitionCount
      : 0
  const minDeltaE2000 = transitionCount > 0 ? Math.min(...deltaE2000List) : 0
  const maxDeltaE2000 = transitionCount > 0 ? Math.max(...deltaE2000List) : 0
  const variance =
    transitionCount > 0
      ? deltaE2000List.reduce((acc, v) => acc + Math.pow(v - meanDeltaE2000, 2), 0) /
        transitionCount
      : 0
  const stdDevDeltaE2000 = Math.sqrt(variance)
  const meanDeltaEOk =
    transitionCount > 0
      ? deltaEOkList.reduce((acc, v) => acc + v, 0) / transitionCount
      : 0
  const maxDeltaEOk = transitionCount > 0 ? Math.max(...deltaEOkList) : 0
  const meanToneStep =
    transitionCount > 0
      ? deltaTAbsList.reduce((acc, v) => acc + v, 0) / transitionCount
      : 0
  const meanPowerMw = steps.length > 0 ? powerSum / steps.length : 0

  return {
    steps,
    invalidTokens: resolved.invalidTokens,
    summary: {
      stepCount: steps.length,
      transitionCount,
      meanDeltaE2000,
      minDeltaE2000,
      maxDeltaE2000,
      stdDevDeltaE2000,
      meanDeltaEOk,
      maxDeltaEOk,
      maxAbsDeltaH,
      meanToneStep,
      meanPowerMw,
      peakBlueStress,
    },
  }
}

const selectEmissiveOpts = createSelector(
  [
    (state: RootState) => state.studio.emissiveProfile,
    (state: RootState) => state.studio.burnInGuard,
    (state: RootState) => state.studio.antiFringing,
  ],
  (profile, burnInGuard, antiFringing) => ({ profile, burnInGuard, antiFringing }),
)

export const selectReferenceHexState = createSelector(
  [(state: RootState) => state.delta.referenceHexInput],
  (rawInput) => {
    const candidate = normalizeHexCandidate(rawInput)
    if (HexColorPattern.test(candidate)) {
      const hex = candidate.toUpperCase()
      return {
        hex,
        tone: hexToOkyct(hex).t,
        isValid: true,
      }
    }
    return {
      hex: '#FFFFFF',
      tone: 100,
      isValid: false,
    }
  },
)

const selectScaleAResolvedSteps = createSelector(
  [
    (state: RootState) => state.delta.scaleASource,
    (state: RootState) => state.delta.scaleACustomId,
    (state: RootState) => state.delta.scaleAManualInput,
    selectPalettes,
    selectCustomLight,
    (state: RootState) => state.delta.applyEmissiveProfile,
    selectEmissiveOpts,
  ],
  resolveScaleSteps,
)

const selectScaleBResolvedSteps = createSelector(
  [
    (state: RootState) => state.delta.scaleBSource,
    (state: RootState) => state.delta.scaleBCustomId,
    (state: RootState) => state.delta.scaleBManualInput,
    selectPalettes,
    selectCustomLight,
    (state: RootState) => state.delta.applyEmissiveProfile,
    selectEmissiveOpts,
  ],
  resolveScaleSteps,
)

export const selectScaleACoreAnalysis = createSelector(
  [selectScaleAResolvedSteps, (state: RootState) => state.studio.cvdType],
  analyzeScaleCore,
)

export const selectScaleBCoreAnalysis = createSelector(
  [selectScaleBResolvedSteps, (state: RootState) => state.studio.cvdType],
  analyzeScaleCore,
)

export const selectScaleAContrastRows = createSelector(
  [selectScaleACoreAnalysis, selectReferenceHexState],
  (analysis, refState): readonly StepContrastRow[] =>
    analysis.steps.map((step) => ({
      index: step.index,
      label: step.label,
      hex: step.hex,
      swatchHex: step.swatchHex,
      tone: step.okyct.t,
      wcagVsWhite: getContrastRatio(step.okyct.t, 100),
      wcagVsBlack: getContrastRatio(step.okyct.t, 0),
      wcagVsRef: getContrastRatio(step.okyct.t, refState.tone),
      apcaVsWhite: getApcaContrast(step.hex, '#FFFFFF'),
      apcaVsBlack: getApcaContrast(step.hex, '#000000'),
      apcaVsRef: getApcaContrast(step.hex, refState.hex),
    })),
)

export const selectScalePairComparison = createSelector(
  [
    (state: RootState) => state.delta.compareEnabled,
    selectScaleACoreAnalysis,
    selectScaleBCoreAnalysis,
  ],
  (compareEnabled, scaleA, scaleB): readonly ScalePairComparisonRow[] => {
    if (!compareEnabled) return []
    const count = Math.min(scaleA.steps.length, scaleB.steps.length)
    const rows: ScalePairComparisonRow[] = []
    for (let i = 0; i < count; i++) {
      const a = scaleA.steps[i]
      const b = scaleB.steps[i]
      rows.push({
        index: i,
        labelA: a.label,
        labelB: b.label,
        hexA: a.hex,
        hexB: b.hex,
        swatchA: a.swatchHex,
        swatchB: b.swatchHex,
        deltaE2000: getDeltaE2000(a.hex, b.hex),
        deltaEOk: getDeltaEOklab(a.hex, b.hex),
        deltaT: b.okyct.t - a.okyct.t,
        deltaC: b.okyct.c - a.okyct.c,
        deltaH: shortestHueDelta(a.okyct.h, b.okyct.h),
        wcagBetweenAB: getContrastRatio(a.okyct.t, b.okyct.t),
        apcaBetweenAB: getApcaContrast(a.hex, b.hex),
        powerDeltaMw: b.telemetry.powerMw - a.telemetry.powerMw,
      })
    }
    return rows
  },
)
