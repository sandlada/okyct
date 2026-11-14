import {
  ContrastMetrics,
  getApcaContrast,
  getContrastRatio,
  hexToOkyct,
  shortestHueDelta,
  solveTonesForContrast,
  type ContrastMetric,
} from '../domain/index.ts'
import {
  ThemeModes,
  type CustomColorInput,
  type ResolveCustomColorsOptions,
  type ResolvedCustomColor,
} from '../ports/inbound/scheme-building.port.ts'
import { harmonizeHex } from './harmonize-hex.ts'
import { compositeGuardedStateHex } from './internal/composite-guarded-state-hex.ts'
import { formatStateLayerKey, normalizeStateLayerStates } from './internal/scheme-token-role-map.ts'
import { TonalPalette } from './tonal-palette.ts'

function meetsTarget(
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

function resolveForegroundHex(
  palette: TonalPalette,
  initialTone: number,
  bgHex: string,
  preferLight: boolean,
  minRatio: number,
  minApca: number,
  metric: ContrastMetric
): string {
  let tone = initialTone
  let fgHex = palette.tone(tone)
  if (meetsTarget(fgHex, bgHex, minRatio, minApca, metric)) return fgHex

  const solved = solveTonesForContrast(bgHex, minRatio, { metric, targetLc: minApca })
  tone = preferLight
    ? (solved.lightForegroundTone ?? 100)
    : (solved.darkForegroundTone ?? 0)
  fgHex = palette.tone(tone)

  let steps = 0
  while (!meetsTarget(fgHex, bgHex, minRatio, minApca, metric) && steps < 20) {
    tone = preferLight ? Math.min(100, tone + 0.5) : Math.max(0, tone - 0.5)
    fgHex = palette.tone(tone)
    if (tone <= 0 || tone >= 100) break
    steps++
  }

  return fgHex
}

export function resolveCustomColors(
  configs: readonly CustomColorInput[],
  primarySeedHex: string,
  options: ResolveCustomColorsOptions = {}
): ResolvedCustomColor[] {
  if (!Array.isArray(configs)) {
    throw new Error('Invalid custom color configs: expected an array of CustomColorInput.')
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Invalid resolveCustomColors options: expected an object.')
  }
  const mode = options.mode ?? 'dark'
  if (!ThemeModes.includes(mode)) {
    throw new Error(`Invalid theme mode: "${String(mode)}". Expected one of: ${ThemeModes.join(', ')}.`)
  }
  const rawContrast = options.contrastLevel ?? 0.0
  if (!Number.isFinite(rawContrast)) {
    throw new Error(`Invalid contrastLevel: ${rawContrast}. Expected a finite number in [-1.0, 1.0].`)
  }
  const contrastMetric = options.contrastMetric ?? 'both'
  if (!ContrastMetrics.includes(contrastMetric)) {
    throw new Error(
      `Invalid contrastMetric: "${String(contrastMetric)}". Expected one of: ${ContrastMetrics.join(', ')}.`
    )
  }

  const isDark = mode === 'dark'
  const clampedContrast = Math.max(-1.0, Math.min(1.0, rawContrast))
  const targetRatio = clampedContrast >= 0.8 ? 7.0 : clampedContrast >= 0.35 ? 5.8 : 4.5
  const targetApca = clampedContrast >= 0.8 ? 75 : clampedContrast >= 0.35 ? 65 : 60
  const requestedStates = normalizeStateLayerStates(options.stateLayers)
  const blendSpace = options.stateLayersBlendSpace ?? 'okyct'
  const contrastGuard = options.stateLayersContrastGuard ?? false

  return configs.map((cfg) => {
    if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
      throw new Error('Invalid custom color entry: expected a CustomColorInput object.')
    }
    const name = typeof cfg.name === 'string' ? cfg.name.trim() : ''
    if (name.length === 0 || name.replace(/[-_\s]+/g, '').length === 0) {
      throw new Error('Invalid custom color name: expected a non-empty identifier string.')
    }
    if (cfg.id !== undefined && (typeof cfg.id !== 'string' || cfg.id.trim().length === 0)) {
      throw new Error('Invalid custom color id: expected a non-empty string when provided.')
    }
    if (cfg.label !== undefined && (typeof cfg.label !== 'string' || cfg.label.trim().length === 0)) {
      throw new Error('Invalid custom color label: expected a non-empty string when provided.')
    }
    if (cfg.harmonize !== undefined && typeof cfg.harmonize !== 'boolean') {
      throw new Error('Invalid custom color harmonize option: expected a boolean.')
    }
    const id = cfg.id?.trim() ?? name
    const label = cfg.label?.trim() ?? name
    const harmonize = cfg.harmonize ?? true

    const origOkyct = hexToOkyct(cfg.sourceHex)
    const effectiveHex = harmonize
      ? harmonizeHex(cfg.sourceHex, primarySeedHex, 18)
      : cfg.sourceHex

    const harmOkyct = hexToOkyct(effectiveHex)
    const hueDiff = shortestHueDelta(harmOkyct.h, origOkyct.h)
    const palette = TonalPalette.fromHex(effectiveHex)

    const colorTone = isDark ? (clampedContrast > 0.3 ? 86 : 80) : (clampedContrast > 0.3 ? 32 : 40)
    const containerTone = isDark ? 30 : 90

    const colorHex = palette.tone(colorTone)
    const containerHex = palette.tone(containerTone)

    const onColorHex = resolveForegroundHex(
      palette,
      isDark ? 20 : 100,
      colorHex,
      !isDark,
      targetRatio,
      targetApca,
      contrastMetric
    )
    const onContainerHex = resolveForegroundHex(
      palette,
      isDark ? 90 : 10,
      containerHex,
      isDark,
      targetRatio,
      targetApca,
      contrastMetric
    )

    const resolved: ResolvedCustomColor = {
      id,
      name,
      label,
      sourceHex: cfg.sourceHex,
      harmonizedHex: effectiveHex,
      hueShiftDeg: parseFloat(hueDiff.toFixed(1)),
      color: colorHex,
      onColor: onColorHex,
      colorContainer: containerHex,
      onColorContainer: onContainerHex,
      wcagRatioColor: parseFloat(getContrastRatio(onColorHex, colorHex).toFixed(2)),
      wcagRatioContainer: parseFloat(getContrastRatio(onContainerHex, containerHex).toFixed(2)),
      apcaLcColor: Math.abs(getApcaContrast(onColorHex, colorHex)),
      apcaLcContainer: Math.abs(getApcaContrast(onContainerHex, containerHex)),
    }

    if (requestedStates.length > 0) {
      const stateLayers: Record<string, string> = {}
      for (const state of requestedStates) {
        stateLayers[formatStateLayerKey('color', state)] = compositeGuardedStateHex(
          colorHex,
          onColorHex,
          state,
          blendSpace,
          contrastGuard
        )
        stateLayers[formatStateLayerKey('onColor', state)] = compositeGuardedStateHex(
          onColorHex,
          colorHex,
          state,
          blendSpace,
          contrastGuard
        )
        stateLayers[formatStateLayerKey('colorContainer', state)] = compositeGuardedStateHex(
          containerHex,
          onContainerHex,
          state,
          blendSpace,
          contrastGuard
        )
        stateLayers[formatStateLayerKey('onColorContainer', state)] = compositeGuardedStateHex(
          onContainerHex,
          containerHex,
          state,
          blendSpace,
          contrastGuard
        )
      }
      resolved.stateLayers = stateLayers
    }

    return resolved
  })
}
