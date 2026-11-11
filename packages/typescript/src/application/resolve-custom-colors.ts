
import { getContrastRatio, solveTonesForContrast, hexToOkyct, shortestHueDelta } from '../domain/index.ts'
import type { CustomColorConfig, ResolvedCustomColor } from '../ports/inbound/scheme-building.port.ts'
import { TonalPalette } from './tonal-palette.ts'
import { harmonizeHex } from './harmonize-hex.ts'

export function resolveCustomColors(
  configs: readonly CustomColorConfig[],
  primarySeedHex: string,
  isDark: boolean,
  contrastLevel = 0.0
): ResolvedCustomColor[] {
  const targetRatio = contrastLevel >= 0.8 ? 7.0 : contrastLevel >= 0.35 ? 5.8 : 4.5

  return configs.map((cfg) => {
    const effectiveHex = cfg.harmonize
      ? harmonizeHex(cfg.sourceHex, primarySeedHex, 18)
      : cfg.sourceHex

    const origOkyct = hexToOkyct(cfg.sourceHex)
    const harmOkyct = hexToOkyct(effectiveHex)
    const hueDiff = shortestHueDelta(harmOkyct.h, origOkyct.h)

    const palette = TonalPalette.fromHex(effectiveHex)

    const colorTone = isDark ? (contrastLevel > 0.3 ? 86 : 80) : (contrastLevel > 0.3 ? 32 : 40)
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
      id: cfg.id,
      name: cfg.name,
      label: cfg.label,
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
