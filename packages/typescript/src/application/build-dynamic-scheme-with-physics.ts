import {
  ContrastMetrics,
  getApcaContrast,
  getContrastRatio,
  hexToOkyct,
  solveTonesForContrast,
  type ContrastMetric,
} from '../domain/index.ts'
import {
  EmissivePanelTypes,
  SystemColorTokens,
  ThemeModes,
  type BuildDynamicSchemeOptions,
  type DynamicSchemeColors,
  type EmissivePanelType,
  type SystemColorToken,
} from '../ports/inbound/scheme-building.port.ts'
import {
  DefaultEmissivePanelSpecs,
  type IDisplayPhysicsPort,
} from '../ports/outbound/display-physics.port.ts'
import { SchemeTokenRoleMap, type SchemeRoleKind } from './internal/scheme-token-role-map.ts'
import type { PaletteSet } from './palette-set.ts'
import type { TonalPalette } from './tonal-palette.ts'

interface ContrastPairSpec {
  fg: SystemColorToken
  bg: SystemColorToken
  minRatio: number
  minApca: number
}

function meetsContrast(
  fgHex: string,
  bgHex: string,
  minRatio: number,
  minApca: number,
  metric: ContrastMetric
): boolean {
  if (metric !== 'apca' && getContrastRatio(fgHex, bgHex) < minRatio) return false
  if (metric !== 'wcag' && Math.abs(getApcaContrast(fgHex, bgHex)) < minApca) return false
  return true
}

export function buildDynamicSchemeWithPhysics(
  palettes: PaletteSet,
  options: BuildDynamicSchemeOptions = {},
  physicsPort?: Pick<
    IDisplayPhysicsPort,
    'getPanelSpec' | 'applyBlueBurnInGuard' | 'applySubpixelEdgeCompensation'
  >
): DynamicSchemeColors {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid buildDynamicSchemeWithPhysics options: expected an object.')
  }
  const mode = options.mode ?? 'dark'
  if (!ThemeModes.includes(mode)) {
    throw new Error(`Invalid theme mode: "${String(mode)}". Expected one of: ${ThemeModes.join(', ')}.`)
  }
  const contrastLevel = options.contrastLevel ?? 0.0
  if (!Number.isFinite(contrastLevel)) {
    throw new Error(`Invalid contrastLevel: ${contrastLevel}. Expected a finite number in [-1.0, 1.0].`)
  }
  const contrastMetric = options.contrastMetric ?? 'both'
  if (!ContrastMetrics.includes(contrastMetric)) {
    throw new Error(
      `Invalid contrastMetric: "${String(contrastMetric)}". Expected one of: ${ContrastMetrics.join(', ')}.`
    )
  }

  const emissiveOptions = options.emissive ?? {}
  const profile: EmissivePanelType = emissiveOptions.profile ?? 'standard-lcd'
  if (!EmissivePanelTypes.includes(profile)) {
    throw new Error(
      `Invalid emissive profile: "${String(profile)}". Expected one of: ${EmissivePanelTypes.join(', ')}.`
    )
  }
  const burnInGuard = emissiveOptions.burnInGuard ?? false
  const antiFringing = emissiveOptions.antiFringing ?? false

  const isDark = mode === 'dark'
  const c = Math.max(-1.0, Math.min(1.0, contrastLevel))
  const panelSpec = physicsPort
    ? physicsPort.getPanelSpec(profile)
    : DefaultEmissivePanelSpecs[profile]

  const peakWhiteCap = panelSpec.lightPeakToneCap
  const fgHighlightCap = antiFringing
    ? profile === 'micro-oled-xr'
      ? Math.min(peakWhiteCap, 92)
      : profile === 'amoled-anti-smear'
      ? Math.min(peakWhiteCap, 97)
      : peakWhiteCap
    : peakWhiteCap

  const adjustTone = (baseTone: number, polarity: 'lighten' | 'darken', delta = 15): number => {
    if (c === 0) return baseTone
    const factor = c > 0 ? c : c * 0.5
    if (polarity === 'lighten') {
      return Math.min(peakWhiteCap, Math.round(baseTone + delta * factor))
    }
    return Math.max(0, Math.round(baseTone - delta * factor))
  }

  const lightSurfaceCap = profile === 'micro-oled-xr' ? 94 : 98
  const darkFloors = panelSpec.darkSurfaceTones

  const tones: Record<SystemColorToken, number> = !isDark
    ? {
        primary: adjustTone(40, 'darken', 12),
        onPrimary: fgHighlightCap,
        primaryContainer: adjustTone(90, 'lighten', 5),
        onPrimaryContainer: adjustTone(10, 'darken', 6),
        primaryFixed: Math.min(peakWhiteCap, 90),
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 28,

        secondary: adjustTone(40, 'darken', 10),
        onSecondary: fgHighlightCap,
        secondaryContainer: adjustTone(90, 'lighten', 5),
        onSecondaryContainer: adjustTone(10, 'darken', 6),

        tertiary: adjustTone(40, 'darken', 10),
        onTertiary: fgHighlightCap,
        tertiaryContainer: adjustTone(90, 'lighten', 5),
        onTertiaryContainer: adjustTone(10, 'darken', 6),

        error: adjustTone(40, 'darken', 10),
        onError: fgHighlightCap,
        errorContainer: Math.min(peakWhiteCap, 90),
        onErrorContainer: 10,

        warning: adjustTone(42, 'darken', 10),
        onWarning: fgHighlightCap,
        warningContainer: Math.min(peakWhiteCap, 90),
        onWarningContainer: 12,

        success: adjustTone(38, 'darken', 10),
        onSuccess: fgHighlightCap,
        successContainer: Math.min(peakWhiteCap, 90),
        onSuccessContainer: 10,

        info: adjustTone(40, 'darken', 10),
        onInfo: fgHighlightCap,
        infoContainer: adjustTone(90, 'lighten', 5),
        onInfoContainer: adjustTone(10, 'darken', 6),

        surface: Math.min(lightSurfaceCap, adjustTone(98, 'lighten', 2)),
        onSurface: adjustTone(10, 'darken', 8),
        surfaceVariant: adjustTone(90, 'darken', 4),
        onSurfaceVariant: adjustTone(30, 'darken', 10),

        surfaceDim: 87,
        surfaceBright: lightSurfaceCap,
        surfaceContainerLowest: profile === 'micro-oled-xr' ? 96 : peakWhiteCap,
        surfaceContainerLow: profile === 'micro-oled-xr' ? 92 : 96,
        surfaceContainer: profile === 'micro-oled-xr' ? 90 : 94,
        surfaceContainerHigh: profile === 'micro-oled-xr' ? 88 : 92,
        surfaceContainerHighest: profile === 'micro-oled-xr' ? 85 : 90,

        outline: adjustTone(50, 'darken', 15),
        outlineVariant: adjustTone(80, 'darken', 10),
        inverseSurface: 20,
        inverseOnSurface: Math.min(fgHighlightCap, 95),
        inversePrimary: 80,
        inverseOnPrimary: 20,
        inversePrimaryContainer: adjustTone(30, 'darken', 6),
        inverseOnPrimaryContainer: Math.min(fgHighlightCap, adjustTone(90, 'lighten', 6)),
        scrim: 0,
        shadow: 0,
      }
    : {
        primary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 12)),
        onPrimary: adjustTone(20, 'darken', 10),
        primaryContainer: adjustTone(30, 'darken', 6),
        onPrimaryContainer: Math.min(fgHighlightCap, adjustTone(90, 'lighten', 6)),
        primaryFixed: Math.min(peakWhiteCap, 90),
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 28,

        secondary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onSecondary: adjustTone(20, 'darken', 10),
        secondaryContainer: adjustTone(30, 'darken', 6),
        onSecondaryContainer: Math.min(fgHighlightCap, adjustTone(90, 'lighten', 6)),

        tertiary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onTertiary: adjustTone(20, 'darken', 10),
        tertiaryContainer: adjustTone(30, 'darken', 6),
        onTertiaryContainer: Math.min(fgHighlightCap, adjustTone(90, 'lighten', 6)),

        error: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onError: 20,
        errorContainer: 30,
        onErrorContainer: Math.min(fgHighlightCap, 90),

        warning: Math.min(peakWhiteCap, adjustTone(82, 'lighten', 10)),
        onWarning: 20,
        warningContainer: 32,
        onWarningContainer: Math.min(fgHighlightCap, 90),

        success: Math.min(peakWhiteCap, adjustTone(78, 'lighten', 10)),
        onSuccess: 18,
        successContainer: 28,
        onSuccessContainer: Math.min(fgHighlightCap, 90),

        info: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onInfo: 20,
        infoContainer: 30,
        onInfoContainer: Math.min(fgHighlightCap, 90),

        surface: darkFloors.surface,
        onSurface: Math.min(fgHighlightCap, adjustTone(90, 'lighten', 8)),
        surfaceVariant: adjustTone(30, 'lighten', 5),
        onSurfaceVariant: Math.min(fgHighlightCap, adjustTone(80, 'lighten', 10)),

        surfaceDim: darkFloors.surface,
        surfaceBright: darkFloors.bright,
        surfaceContainerLowest: darkFloors.lowest,
        surfaceContainerLow: darkFloors.low,
        surfaceContainer: darkFloors.container,
        surfaceContainerHigh: darkFloors.high,
        surfaceContainerHighest: darkFloors.highest,

        outline: adjustTone(60, 'lighten', 15),
        outlineVariant: adjustTone(30, 'lighten', 10),
        inverseSurface: Math.min(peakWhiteCap, 90),
        inverseOnSurface: 20,
        inversePrimary: 40,
        inverseOnPrimary: fgHighlightCap,
        inversePrimaryContainer: adjustTone(90, 'lighten', 5),
        inverseOnPrimaryContainer: adjustTone(10, 'darken', 6),
        scrim: 0,
        shadow: 0,
      }

  const targetTextRatio = c >= 0.8 ? 7.0 : c >= 0.35 ? 5.8 : 4.5
  const targetTextApca = c >= 0.8 ? 75 : c >= 0.35 ? 65 : 60
  const targetOutlineRatio = c >= 0.5 ? 4.5 : 3.0
  const targetOutlineApca = c >= 0.5 ? 60 : 45

  const pairSpecs: ReadonlyArray<ContrastPairSpec> = [
    { fg: 'onPrimary', bg: 'primary', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onPrimaryContainer', bg: 'primaryContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onPrimaryFixed', bg: 'primaryFixed', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onPrimaryFixedVariant', bg: 'primaryFixedDim', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSecondary', bg: 'secondary', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSecondaryContainer', bg: 'secondaryContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onTertiary', bg: 'tertiary', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onTertiaryContainer', bg: 'tertiaryContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSurface', bg: 'surface', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSurface', bg: 'surfaceContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSurfaceVariant', bg: 'surfaceVariant', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onError', bg: 'error', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onErrorContainer', bg: 'errorContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onWarning', bg: 'warning', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onWarningContainer', bg: 'warningContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSuccess', bg: 'success', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onSuccessContainer', bg: 'successContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onInfo', bg: 'info', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'onInfoContainer', bg: 'infoContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'inverseOnSurface', bg: 'inverseSurface', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'inverseOnPrimary', bg: 'inversePrimary', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'inverseOnPrimaryContainer', bg: 'inversePrimaryContainer', minRatio: targetTextRatio, minApca: targetTextApca },
    { fg: 'outline', bg: 'surface', minRatio: targetOutlineRatio, minApca: targetOutlineApca },
  ]

  const resolveRoleHex = (
    palette: TonalPalette,
    tone: number,
    roleKind: SchemeRoleKind
  ): string => {
    if (tone <= 0) return '#000000'
    let hex = palette.tone(tone)
    if (physicsPort) {
      if (burnInGuard && roleKind !== 'surface') {
        hex = physicsPort.applyBlueBurnInGuard(hex)
      }
      if (antiFringing) {
        hex = physicsPort.applySubpixelEdgeCompensation(hex, profile, roleKind)
      }
    }
    return hex
  }

  const resolvedColors = {} as Record<SystemColorToken, string>
  for (const token of SystemColorTokens) {
    const binding = SchemeTokenRoleMap[token]
    resolvedColors[token] = resolveRoleHex(palettes[binding.palette], tones[token], binding.kind)
  }

  const enforceHexPairClosure = (spec: ContrastPairSpec) => {
    let fgHex = resolvedColors[spec.fg]
    let bgHex = resolvedColors[spec.bg]
    if (meetsContrast(fgHex, bgHex, spec.minRatio, spec.minApca, contrastMetric)) return

    const fgBinding = SchemeTokenRoleMap[spec.fg]
    const bgBinding = SchemeTokenRoleMap[spec.bg]
    const fgPalette = palettes[fgBinding.palette]
    const bgPalette = palettes[bgBinding.palette]

    const fgMeasuredT = hexToOkyct(fgHex).t
    const bgMeasuredT = hexToOkyct(bgHex).t
    const solved = solveTonesForContrast(bgMeasuredT, spec.minRatio, {
      metric: contrastMetric,
      targetLc: spec.minApca,
    })

    const preferLightFg = fgMeasuredT >= bgMeasuredT
    const fgCap = fgBinding.kind === 'foreground' ? fgHighlightCap : peakWhiteCap

    if (preferLightFg) {
      let candidateT =
        solved.lightForegroundTone !== null && solved.lightForegroundTone <= fgCap
          ? solved.lightForegroundTone
          : fgCap

      let candidateHex = resolveRoleHex(fgPalette, candidateT, fgBinding.kind)
      let steps = 0
      while (
        !meetsContrast(candidateHex, bgHex, spec.minRatio, spec.minApca, contrastMetric) &&
        candidateT < fgCap &&
        steps < 24
      ) {
        candidateT = Math.min(fgCap, candidateT + 0.5)
        candidateHex = resolveRoleHex(fgPalette, candidateT, fgBinding.kind)
        steps++
      }

      if (meetsContrast(candidateHex, bgHex, spec.minRatio, spec.minApca, contrastMetric)) {
        tones[spec.fg] = candidateT
        resolvedColors[spec.fg] = candidateHex
        return
      }

      // Apply peak foreground cap and nudge background darker within panel floor if needed
      tones[spec.fg] = candidateT
      resolvedColors[spec.fg] = candidateHex
      fgHex = candidateHex

      const bgFloor = bgBinding.kind === 'surface' && isDark ? darkFloors.surface : 0
      const bgSolved = solveTonesForContrast(hexToOkyct(fgHex).t, spec.minRatio, {
        metric: contrastMetric,
        targetLc: spec.minApca,
      })
      let bgT =
        bgSolved.darkForegroundTone !== null
          ? Math.max(bgFloor, bgSolved.darkForegroundTone)
          : bgFloor
      let nextBgHex = resolveRoleHex(bgPalette, bgT, bgBinding.kind)
      let bgSteps = 0
      while (
        !meetsContrast(fgHex, nextBgHex, spec.minRatio, spec.minApca, contrastMetric) &&
        bgT > bgFloor &&
        bgSteps < 24
      ) {
        bgT = Math.max(bgFloor, bgT - 0.5)
        nextBgHex = resolveRoleHex(bgPalette, bgT, bgBinding.kind)
        bgSteps++
      }
      tones[spec.bg] = bgT
      resolvedColors[spec.bg] = nextBgHex
    } else {
      let candidateT = solved.darkForegroundTone !== null ? solved.darkForegroundTone : 0
      let candidateHex = resolveRoleHex(fgPalette, candidateT, fgBinding.kind)
      let steps = 0
      while (
        !meetsContrast(candidateHex, bgHex, spec.minRatio, spec.minApca, contrastMetric) &&
        candidateT > 0 &&
        steps < 24
      ) {
        candidateT = Math.max(0, candidateT - 0.5)
        candidateHex = resolveRoleHex(fgPalette, candidateT, fgBinding.kind)
        steps++
      }

      if (meetsContrast(candidateHex, bgHex, spec.minRatio, spec.minApca, contrastMetric)) {
        tones[spec.fg] = candidateT
        resolvedColors[spec.fg] = candidateHex
        return
      }

      // If dark foreground cannot go lower, flip or nudge light background up
      const bgSolved = solveTonesForContrast(hexToOkyct(candidateHex).t, spec.minRatio, {
        metric: contrastMetric,
        targetLc: spec.minApca,
      })
      if (bgSolved.lightForegroundTone !== null && bgSolved.lightForegroundTone <= peakWhiteCap) {
        let bgT = bgSolved.lightForegroundTone
        let nextBgHex = resolveRoleHex(bgPalette, bgT, bgBinding.kind)
        let bgSteps = 0
        while (
          !meetsContrast(candidateHex, nextBgHex, spec.minRatio, spec.minApca, contrastMetric) &&
          bgT < peakWhiteCap &&
          bgSteps < 24
        ) {
          bgT = Math.min(peakWhiteCap, bgT + 0.5)
          nextBgHex = resolveRoleHex(bgPalette, bgT, bgBinding.kind)
          bgSteps++
        }
        tones[spec.fg] = candidateT
        resolvedColors[spec.fg] = candidateHex
        tones[spec.bg] = bgT
        resolvedColors[spec.bg] = nextBgHex
      } else {
        tones[spec.fg] = candidateT
        resolvedColors[spec.fg] = candidateHex
      }
    }
  }

  for (const pair of pairSpecs) {
    enforceHexPairClosure(pair)
  }

  for (const token of SystemColorTokens) {
    tones[token] = parseFloat(hexToOkyct(resolvedColors[token]).t.toFixed(2))
  }

  return {
    ...resolvedColors,
    tones,
  }
}
