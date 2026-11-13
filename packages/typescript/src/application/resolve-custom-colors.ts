
import { getContrastRatio, solveTonesForContrast, hexToOkyct, shortestHueDelta } from '../domain/index.ts'
import type { CustomColorInput, ResolvedCustomColor } from '../ports/inbound/scheme-building.port.ts'
import { TonalPalette } from './tonal-palette.ts'
import { harmonizeHex } from './harmonize-hex.ts'

export function resolveCustomColors(
  configs: readonly CustomColorInput[],
  primarySeedHex: string,
  isDark: boolean,
  contrastLevel = 0.0
): ResolvedCustomColor[] {
  if (!Array.isArray(configs)) {
    throw new Error('Invalid custom color configs: expected an array of CustomColorInput.')
  }
  if (!Number.isFinite(contrastLevel)) {
    throw new Error(`Invalid contrastLevel: ${contrastLevel}. Expected a finite number in [-1.0, 1.0].`)
  }
  const clampedContrast = Math.max(-1.0, Math.min(1.0, contrastLevel))
  const targetRatio = clampedContrast >= 0.8 ? 7.0 : clampedContrast >= 0.35 ? 5.8 : 4.5

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
    let onColorTone = isDark ? 20 : 100
    const containerTone = isDark ? 30 : 90
    let onContainerTone = isDark ? 90 : 10

    if (getContrastRatio(onColorTone, colorTone) < targetRatio) {
      const solved = solveTonesForContrast(colorTone, targetRatio)
      onColorTone = isDark
        ? (solved.darkForegroundTone ?? 0)
        : (solved.lightForegroundTone ?? 100)
    }
    if (getContrastRatio(onContainerTone, containerTone) < targetRatio) {
      const solved = solveTonesForContrast(containerTone, targetRatio)
      onContainerTone = isDark
        ? (solved.lightForegroundTone ?? 100)
        : (solved.darkForegroundTone ?? 0)
    }

    return {
      id,
      name,
      label,
      sourceHex: cfg.sourceHex,
      harmonizedHex: effectiveHex,
      hueShiftDeg: parseFloat(hueDiff.toFixed(1)),
      color: palette.tone(colorTone),
      onColor: palette.tone(onColorTone),
      colorContainer: palette.tone(containerTone),
      onColorContainer: palette.tone(onContainerTone),
      wcagRatioColor: parseFloat(getContrastRatio(onColorTone, colorTone).toFixed(2)),
      wcagRatioContainer: parseFloat(getContrastRatio(onContainerTone, containerTone).toFixed(2)),
    }
  })
}
