import {
  ContrastMetrics,
  getApcaContrast,
  getContrastRatio,
  hexToOkyct,
  solveTonesForContrast,
  toneToY,
  type ContrastMetric,
  type OKYCT,
} from '../domain/index.ts'
import {
  AmbientSurrounds,
  EmissivePanelTypes,
  SystemColorTokens,
  ThemeModes,
  type AmbientSurround,
  type BuildDynamicSchemeOptions,
  type DynamicSchemeColors,
  type EmissivePanelType,
  type SystemColorToken,
} from '../ports/index.ts'
import {
  DefaultEmissivePanelSpecs,
  type IDisplayPhysicsPort,
} from '../ports/index.ts'
import { refineToneForContrast } from './internal/refine-tone-for-contrast.ts'
import { SchemeTokenRoleMap, normalizeStateLayerStates, type SchemeRoleKind } from './internal/scheme-token-role-map.ts'
import type { PaletteSet } from './palette-set.ts'
import { resolveSchemeStateLayers } from './resolve-scheme-state-layers.ts'
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
  const ambient: AmbientSurround = options.ambient ?? 'normal'
  if (!AmbientSurrounds.includes(ambient)) {
    throw new Error(
      `Invalid ambient surround: "${String(ambient)}". Expected one of: ${AmbientSurrounds.join(', ')}.`
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
  const ablGuard = emissiveOptions.ablGuard ?? false

  const isDark = mode === 'dark'
  const baseC = Math.max(-1.0, Math.min(1.0, contrastLevel))
  const c = ambient === 'bright' ? Math.min(1.0, baseC + 0.35) : baseC
  const panelSpec = physicsPort
    ? physicsPort.getPanelSpec(profile)
    : DefaultEmissivePanelSpecs[profile]

  const ambientPeakCap = ambient === 'darkroom' ? 90 : 100
  const peakWhiteCap = Math.min(panelSpec.lightPeakToneCap, ambientPeakCap)
  const rawFgCap = antiFringing
    ? profile === 'micro-oled-xr'
      ? Math.min(peakWhiteCap, 92)
      : profile === 'amoled-anti-smear'
      ? Math.min(peakWhiteCap, 97)
      : peakWhiteCap
    : peakWhiteCap
  const fgHighlightCap = ambient === 'darkroom' ? Math.min(rawFgCap, 88) : rawFgCap

  const adjustTone = (baseTone: number, polarity: 'lighten' | 'darken', delta = 15): number => {
    if (c === 0) return baseTone
    const factor = c > 0 ? c : c * 0.5
    if (polarity === 'lighten') {
      return Math.min(peakWhiteCap, Math.round(baseTone + delta * factor))
    }
    return Math.max(0, Math.round(baseTone - delta * factor))
  }

  const lightSurfaceCap = Math.min(
    ambient === 'darkroom' ? 90 : 98,
    profile === 'micro-oled-xr' ? 94 : 98
  )
  const darkFloorLift = ambient === 'bright' ? 2 : 0
  const darkFloors = {
    lowest: panelSpec.darkSurfaceTones.lowest + darkFloorLift,
    surface: panelSpec.darkSurfaceTones.surface + darkFloorLift,
    low: panelSpec.darkSurfaceTones.low + darkFloorLift,
    container: panelSpec.darkSurfaceTones.container + darkFloorLift,
    high: panelSpec.darkSurfaceTones.high + darkFloorLift,
    highest: panelSpec.darkSurfaceTones.highest + darkFloorLift,
    bright: panelSpec.darkSurfaceTones.bright + darkFloorLift,
  }

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

  if (ablGuard && !isDark) {
    const weightedApl =
      (toneToY(tones.surface) * 0.42 +
        toneToY(tones.surfaceContainerLowest) * 0.14 +
        toneToY(tones.surfaceContainerLow) * 0.12 +
        toneToY(tones.surfaceContainer) * 0.12 +
        toneToY(tones.surfaceContainerHigh) * 0.06 +
        toneToY(tones.primary) * 0.05 +
        toneToY(tones.primaryContainer) * 0.04 +
        toneToY(tones.secondaryContainer) * 0.02 +
        toneToY(tones.onSurface) * 0.02 +
        toneToY(tones.onSurfaceVariant) * 0.01) *
      100
    if (weightedApl > 65) {
      tones.surface = Math.min(tones.surface, 84)
      tones.surfaceBright = Math.min(tones.surfaceBright, 86)
      tones.surfaceContainerLowest = Math.min(tones.surfaceContainerLowest, 86)
      tones.surfaceContainerLow = Math.min(tones.surfaceContainerLow, 83)
      tones.surfaceContainer = Math.min(tones.surfaceContainer, 81)
      tones.surfaceContainerHigh = Math.min(tones.surfaceContainerHigh, 79)
      tones.surfaceContainerHighest = Math.min(tones.surfaceContainerHighest, 77)
      tones.surfaceDim = Math.min(tones.surfaceDim, 75)
      tones.surfaceVariant = Math.min(tones.surfaceVariant, 79)
      tones.primaryContainer = Math.min(tones.primaryContainer, 82)
      tones.secondaryContainer = Math.min(tones.secondaryContainer, 82)
      tones.tertiaryContainer = Math.min(tones.tertiaryContainer, 82)
    }
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
      const startFgT =
        solved.lightForegroundTone !== null && solved.lightForegroundTone <= fgCap
          ? solved.lightForegroundTone
          : fgCap

      const fgRefined = refineToneForContrast({
        startTone: startFgT,
        limitTone: fgCap,
        resolveHex: (t) => resolveRoleHex(fgPalette, t, fgBinding.kind),
        passes: (hex) => meetsContrast(hex, bgHex, spec.minRatio, spec.minApca, contrastMetric),
      })

      tones[spec.fg] = fgRefined.tone
      resolvedColors[spec.fg] = fgRefined.hex
      if (fgRefined.passed) return

      fgHex = fgRefined.hex
      const bgFloor = bgBinding.kind === 'surface' && isDark ? darkFloors.surface : 0
      const bgSolved = solveTonesForContrast(hexToOkyct(fgHex).t, spec.minRatio, {
        metric: contrastMetric,
        targetLc: spec.minApca,
      })
      const startBgT =
        bgSolved.darkForegroundTone !== null
          ? Math.max(bgFloor, bgSolved.darkForegroundTone)
          : bgFloor
      const bgRefined = refineToneForContrast({
        startTone: startBgT,
        limitTone: bgFloor,
        resolveHex: (t) => resolveRoleHex(bgPalette, t, bgBinding.kind),
        passes: (hex) => meetsContrast(fgHex, hex, spec.minRatio, spec.minApca, contrastMetric),
      })
      tones[spec.bg] = bgRefined.tone
      resolvedColors[spec.bg] = bgRefined.hex
    } else {
      const startFgT = solved.darkForegroundTone !== null ? solved.darkForegroundTone : 0
      const fgRefined = refineToneForContrast({
        startTone: startFgT,
        limitTone: 0,
        resolveHex: (t) => resolveRoleHex(fgPalette, t, fgBinding.kind),
        passes: (hex) => meetsContrast(hex, bgHex, spec.minRatio, spec.minApca, contrastMetric),
      })

      tones[spec.fg] = fgRefined.tone
      resolvedColors[spec.fg] = fgRefined.hex
      if (fgRefined.passed) return

      // If dark foreground cannot go lower, nudge light background up
      const bgSolved = solveTonesForContrast(hexToOkyct(fgRefined.hex).t, spec.minRatio, {
        metric: contrastMetric,
        targetLc: spec.minApca,
      })
      if (bgSolved.lightForegroundTone !== null && bgSolved.lightForegroundTone <= peakWhiteCap) {
        const bgRefined = refineToneForContrast({
          startTone: bgSolved.lightForegroundTone,
          limitTone: peakWhiteCap,
          resolveHex: (t) => resolveRoleHex(bgPalette, t, bgBinding.kind),
          passes: (hex) =>
            meetsContrast(fgRefined.hex, hex, spec.minRatio, spec.minApca, contrastMetric),
        })
        tones[spec.bg] = bgRefined.tone
        resolvedColors[spec.bg] = bgRefined.hex
      }
    }
  }

  for (const pair of pairSpecs) {
    enforceHexPairClosure(pair)
  }

  const okyct = {} as Record<SystemColorToken, OKYCT>
  const hasPhysicsColorTransform = Boolean(physicsPort && (burnInGuard || antiFringing))

  for (const token of SystemColorTokens) {
    const measured = hexToOkyct(resolvedColors[token])
    tones[token] = parseFloat(measured.t.toFixed(2))

    const binding = SchemeTokenRoleMap[token]
    const palette = palettes[binding.palette]
    const targetGamutCoord = palette.toneOkyct(measured.t, { gamut: palette.gamut })

    if (hasPhysicsColorTransform && (binding.kind !== 'surface' || antiFringing)) {
      if (palette.gamut === 'srgb') {
        okyct[token] = measured
      } else {
        const unguardedSrgb = palette.toneOkyct(measured.t, { gamut: 'srgb' })
        if (unguardedSrgb.c > 1e-4) {
          const chromaScale = Math.min(1, measured.c / unguardedSrgb.c)
          const hueShift = ((measured.h - unguardedSrgb.h + 540) % 360) - 180
          okyct[token] = {
            h: (targetGamutCoord.h + hueShift + 360) % 360,
            c: targetGamutCoord.c * chromaScale,
            t: measured.t,
          }
        } else {
          okyct[token] = measured
        }
      }
    } else {
      okyct[token] = {
        h: targetGamutCoord.h,
        c: targetGamutCoord.c,
        t: measured.t,
      }
    }
  }

  const baseScheme: DynamicSchemeColors = {
    ...resolvedColors,
    tones,
    okyct,
  }

  const requestedStates = normalizeStateLayerStates(options.stateLayers)
  if (requestedStates.length === 0) {
    return baseScheme
  }

  const stateLayers = resolveSchemeStateLayers(baseScheme, requestedStates, {
    blendSpace: options.stateLayersBlendSpace,
    contrastGuard: options.stateLayersContrastGuard,
  })
  return {
    ...baseScheme,
    ...stateLayers,
    stateLayers,
  }
}
