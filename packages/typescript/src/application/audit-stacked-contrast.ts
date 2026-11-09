
import { hexToRgb, rgbToOkyct, getContrastRatio, getApcaContrast, solveTonesForContrast } from '../domain/index.ts'
import type { CompositedResult, StackedContrastReport } from '../ports/inbound/layer-stacking.port.ts'

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

    if (!wcagPassAA) {
      warningMessage = `警告：在 ${composited.totalLayers} 层叠加后，背景 Tone 产生 ΔT=${deltaTone > 0 ? '+' : ''}${deltaTone.toFixed(1)} 偏移，导致对比度跌至 ${wcagRatio.toFixed(2)}:1 (低于 WCAG AA 4.5:1)。`
      const solved = solveTonesForContrast(bgOkyct.t, 4.5)
      recommendedCompensationTone = fgOkyct.t > bgOkyct.t ? solved.lightForegroundTone : solved.darkForegroundTone
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
