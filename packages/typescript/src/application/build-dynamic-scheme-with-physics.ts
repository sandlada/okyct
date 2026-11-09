
import { getContrastRatio, solveTonesForContrast } from '../domain/index.ts'
import {
  SystemColorTokens,
  type SystemColorToken,
  type DynamicSchemeColors,
} from '../ports/inbound/scheme-building.port.ts'
import type {
  EmissivePanelType,
  EmissiveSchemeOptions,
  IDisplayPhysicsPort,
} from '../ports/outbound/display-physics.port.ts'
import type { PaletteSet } from './palette-set.ts'
import { TonalPalette } from './tonal-palette.ts'
import { SchemeTokenRoleMap, type SchemeRoleKind } from './scheme-token-role-map.ts'

export function buildDynamicSchemeWithPhysics(
  palettes: PaletteSet,
  isDark: boolean,
  contrastLevel = 0.0,
  emissiveOptions: EmissiveSchemeOptions = {},
  physicsPort?: Pick<
    IDisplayPhysicsPort,
    'getPanelSpec' | 'applyBlueBurnInGuard' | 'applySubpixelEdgeCompensation'
  >
): DynamicSchemeColors {
  const c = Math.max(-0.5, Math.min(1.0, contrastLevel))
  const profile: EmissivePanelType = emissiveOptions.profile ?? 'standard-lcd'
  const burnInGuard = emissiveOptions.burnInGuard ?? false
  const antiFringing = emissiveOptions.antiFringing ?? false

  const panelSpec = physicsPort
    ? physicsPort.getPanelSpec(profile)
    : {
        lightPeakToneCap: 100,
        darkSurfaceTones: {
          lowest: 4,
          surface: 6,
          low: 10,
          container: 12,
          high: 17,
          highest: 22,
          bright: 24,
        },
      }

  const peakWhiteCap = panelSpec.lightPeakToneCap

  const adjustTone = (baseTone: number, polarity: 'lighten' | 'darken', delta = 15): number => {
    if (c === 0) return baseTone
    const factor = c > 0 ? c : c * 0.5
    if (polarity === 'lighten') {
      return Math.min(peakWhiteCap, Math.round(baseTone + delta * factor))
    } else {
      return Math.max(0, Math.round(baseTone - delta * factor))
    }
  }

  const lightSurfaceCap = profile === 'micro-oled-xr' ? 94 : 98
  const darkFloors = panelSpec.darkSurfaceTones

  const tones: Record<SystemColorToken, number> = !isDark
    ? {
        primary: adjustTone(40, 'darken', 12),
        onPrimary: 100,
        primaryContainer: adjustTone(90, 'lighten', 5),
        onPrimaryContainer: adjustTone(10, 'darken', 6),
        primaryFixed: 90,
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 30,

        secondary: adjustTone(40, 'darken', 10),
        onSecondary: 100,
        secondaryContainer: adjustTone(90, 'lighten', 5),
        onSecondaryContainer: adjustTone(10, 'darken', 6),

        tertiary: adjustTone(40, 'darken', 10),
        onTertiary: 100,
        tertiaryContainer: adjustTone(90, 'lighten', 5),
        onTertiaryContainer: adjustTone(10, 'darken', 6),

        error: adjustTone(40, 'darken', 10),
        onError: 100,
        errorContainer: 90,
        onErrorContainer: 10,

        warning: adjustTone(42, 'darken', 10),
        onWarning: 100,
        warningContainer: 90,
        onWarningContainer: 12,

        success: adjustTone(38, 'darken', 10),
        onSuccess: 100,
        successContainer: 90,
        onSuccessContainer: 10,

        info: adjustTone(40, 'darken', 10),
        onInfo: 100,
        infoContainer: adjustTone(90, 'lighten', 5),
        onInfoContainer: adjustTone(10, 'darken', 6),

        surface: Math.min(lightSurfaceCap, adjustTone(98, 'lighten', 2)),
        onSurface: adjustTone(10, 'darken', 8),
        surfaceVariant: adjustTone(90, 'darken', 4),
        onSurfaceVariant: adjustTone(30, 'darken', 10),

        surfaceDim: 87,
        surfaceBright: lightSurfaceCap,
        surfaceContainerLowest: profile === 'micro-oled-xr' ? 96 : 100,
        surfaceContainerLow: profile === 'micro-oled-xr' ? 92 : 96,
        surfaceContainer: profile === 'micro-oled-xr' ? 90 : 94,
        surfaceContainerHigh: profile === 'micro-oled-xr' ? 88 : 92,
        surfaceContainerHighest: profile === 'micro-oled-xr' ? 85 : 90,

        outline: adjustTone(50, 'darken', 15),
        outlineVariant: adjustTone(80, 'darken', 10),
        inverseSurface: 20,
        inverseOnSurface: 95,
        inversePrimary: 80,
        inverseOnPrimary: 20,
        inversePrimaryContainer: adjustTone(30, 'darken', 6),
        inverseOnPrimaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),
        scrim: 0,
        shadow: 0,
      }
    : {
        primary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 12)),
        onPrimary: adjustTone(20, 'darken', 10),
        primaryContainer: adjustTone(30, 'darken', 6),
        onPrimaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),
        primaryFixed: 90,
        primaryFixedDim: 80,
        onPrimaryFixed: 10,
        onPrimaryFixedVariant: 30,

        secondary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onSecondary: adjustTone(20, 'darken', 10),
        secondaryContainer: adjustTone(30, 'darken', 6),
        onSecondaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),

        tertiary: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onTertiary: adjustTone(20, 'darken', 10),
        tertiaryContainer: adjustTone(30, 'darken', 6),
        onTertiaryContainer: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 6)),

        error: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onError: 20,
        errorContainer: 30,
        onErrorContainer: Math.min(peakWhiteCap, 90),

        warning: Math.min(peakWhiteCap, adjustTone(82, 'lighten', 10)),
        onWarning: 20,
        warningContainer: 32,
        onWarningContainer: Math.min(peakWhiteCap, 90),

        success: Math.min(peakWhiteCap, adjustTone(78, 'lighten', 10)),
        onSuccess: 18,
        successContainer: 28,
        onSuccessContainer: Math.min(peakWhiteCap, 90),

        info: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),
        onInfo: 20,
        infoContainer: 30,
        onInfoContainer: Math.min(peakWhiteCap, 90),

        surface: darkFloors.surface,
        onSurface: Math.min(peakWhiteCap, adjustTone(90, 'lighten', 8)),
        surfaceVariant: adjustTone(30, 'lighten', 5),
        onSurfaceVariant: Math.min(peakWhiteCap, adjustTone(80, 'lighten', 10)),

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
        inverseOnPrimary: 100,
        inversePrimaryContainer: adjustTone(90, 'lighten', 5),
        inverseOnPrimaryContainer: adjustTone(10, 'darken', 6),
        scrim: 0,
        shadow: 0,
      }

  const targetTextRatio = c >= 0.8 ? 7.0 : c >= 0.35 ? 5.8 : 4.5
  const targetOutlineRatio = c >= 0.5 ? 4.5 : 3.0

  const enforceAlgebraicContrast = (
    fgToneKey: SystemColorToken,
    bgToneKey: SystemColorToken,
    minRatio: number
  ) => {
    const fgT = tones[fgToneKey]
    const bgT = tones[bgToneKey]
    if (getContrastRatio(fgT, bgT) >= minRatio) return

    const solved = solveTonesForContrast(bgT, minRatio)
    if (fgT >= bgT) {
      if (solved.lightForegroundTone !== null) {
        tones[fgToneKey] = solved.lightForegroundTone
      } else if (solved.darkForegroundTone !== null) {
        tones[fgToneKey] = solved.darkForegroundTone
      } else {
        tones[fgToneKey] = 100
      }
    } else {
      if (solved.darkForegroundTone !== null) {
        tones[fgToneKey] = solved.darkForegroundTone
      } else if (solved.lightForegroundTone !== null) {
        tones[fgToneKey] = solved.lightForegroundTone
      } else {
        tones[fgToneKey] = 0
      }
    }
  }

  enforceAlgebraicContrast('onPrimary', 'primary', targetTextRatio)
  enforceAlgebraicContrast('onPrimaryContainer', 'primaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onSecondary', 'secondary', targetTextRatio)
  enforceAlgebraicContrast('onSecondaryContainer', 'secondaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onTertiary', 'tertiary', targetTextRatio)
  enforceAlgebraicContrast('onTertiaryContainer', 'tertiaryContainer', targetTextRatio)
  enforceAlgebraicContrast('onSurface', 'surface', targetTextRatio)
  enforceAlgebraicContrast('onSurface', 'surfaceContainer', targetTextRatio)
  enforceAlgebraicContrast('onSurfaceVariant', 'surfaceVariant', targetTextRatio)
  enforceAlgebraicContrast('onError', 'error', targetTextRatio)
  enforceAlgebraicContrast('onErrorContainer', 'errorContainer', targetTextRatio)
  enforceAlgebraicContrast('onWarning', 'warning', targetTextRatio)
  enforceAlgebraicContrast('onWarningContainer', 'warningContainer', targetTextRatio)
  enforceAlgebraicContrast('onSuccess', 'success', targetTextRatio)
  enforceAlgebraicContrast('onSuccessContainer', 'successContainer', targetTextRatio)
  enforceAlgebraicContrast('onInfo', 'info', targetTextRatio)
  enforceAlgebraicContrast('onInfoContainer', 'infoContainer', targetTextRatio)
  enforceAlgebraicContrast('inverseOnSurface', 'inverseSurface', targetTextRatio)
  enforceAlgebraicContrast('inverseOnPrimary', 'inversePrimary', targetTextRatio)
  enforceAlgebraicContrast('inverseOnPrimaryContainer', 'inversePrimaryContainer', targetTextRatio)
  enforceAlgebraicContrast('outline', 'surface', targetOutlineRatio)

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

  return {
    ...resolvedColors,
    tones,
  }
}
