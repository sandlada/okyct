
import type { TokenDictionary } from './token-dictionary.ts'
import { computeColorEmissiveTelemetry } from '../driven-emissive-oled/compute-color-emissive-telemetry.ts'

export interface OledPowerAuditReport {
  passed: boolean
  averagePowerMw: number
  averageAplPercent: number
  maxBlueStressToken: string
  maxBlueStressIndex: number
  trueBlackTokenCount: number
  totalTokensEvaluated: number
}

export const auditOledPower = (
  options: { maxAvgPowerMw?: number; maxBlueStress?: number } = {}
) =>
  (dict: TokenDictionary): OledPowerAuditReport => {
    const maxPowerThreshold = options.maxAvgPowerMw ?? 320
    const maxBlueThreshold = options.maxBlueStress ?? 65

    const entries = Object.entries(dict).filter(([, v]) => /^#([0-9a-f]{6})$/i.test(v.trim()))
    if (entries.length === 0) {
      return {
        passed: true,
        averagePowerMw: 0,
        averageAplPercent: 0,
        maxBlueStressToken: 'none',
        maxBlueStressIndex: 0,
        trueBlackTokenCount: 0,
        totalTokensEvaluated: 0,
      }
    }

    let sumPower = 0
    let sumApl = 0
    let maxBlue = -1
    let maxBlueKey = entries[0][0]
    let trueBlackCount = 0

    for (const [k, hex] of entries) {
      const t = computeColorEmissiveTelemetry(hex)
      sumPower += t.powerMw
      sumApl += t.aplPercent
      if (t.isPixelOff) trueBlackCount++
      if (t.blueStressIndex > maxBlue) {
        maxBlue = t.blueStressIndex
        maxBlueKey = k
      }
    }

    const avgPower = Math.round((sumPower / entries.length) * 10) / 10
    const avgApl = Math.round((sumApl / entries.length) * 10) / 10

    return {
      passed: avgPower <= maxPowerThreshold && maxBlue <= maxBlueThreshold,
      averagePowerMw: avgPower,
      averageAplPercent: avgApl,
      maxBlueStressToken: maxBlueKey,
      maxBlueStressIndex: maxBlue,
      trueBlackTokenCount: trueBlackCount,
      totalTokensEvaluated: entries.length,
    }
  }
