import {
  getApcaContrast,
  getContrastRatio,
  hexToRgb,
  rgbToOkyct,
  solveTonesForContrast,
} from '../domain/index.ts'
import type { CompositedResult, StackedContrastReport } from '../ports/index.ts'

export const auditStackedContrast = (foregroundHex: string) =>
  (composited: CompositedResult): StackedContrastReport => {
    const fgOkyct = rgbToOkyct(hexToRgb(foregroundHex))
    const bgOkyct = composited.finalOkyct
    const baseOkyct = composited.traces[0]?.accumulatedOkyct ?? bgOkyct

    const wcagRatio = getContrastRatio(fgOkyct.t, bgOkyct.t)
    const apcaLc = Math.abs(getApcaContrast(fgOkyct.t, bgOkyct.t))
    const deltaTone = bgOkyct.t - baseOkyct.t

    const wcagPassAA = wcagRatio >= 4.5
    const wcagPassAAA = wcagRatio >= 7.0

    let warningMessage: string | undefined
    let recommendedCompensationTone: number | null = null

    if (!wcagPassAA || apcaLc < 60) {
      warningMessage = `Warning: after ${composited.totalLayers} composited layers, background Tone shifted by ΔT=${deltaTone > 0 ? '+' : ''}${deltaTone.toFixed(1)}, reducing contrast to WCAG ${wcagRatio.toFixed(2)}:1 / APCA Lc ${apcaLc}.`
      const solved = solveTonesForContrast(bgOkyct.t, 4.5, { metric: 'both', targetLc: 60 })
      recommendedCompensationTone =
        fgOkyct.t > bgOkyct.t ? solved.lightForegroundTone : solved.darkForegroundTone
    }

    return {
      foregroundHex,
      finalBackgroundHex: composited.finalHex,
      wcagRatio: parseFloat(wcagRatio.toFixed(2)),
      wcagPassAA,
      wcagPassAAA,
      apcaLc,
      deltaToneFromBase: parseFloat(deltaTone.toFixed(1)),
      warningMessage,
      recommendedCompensationTone,
    }
  }
