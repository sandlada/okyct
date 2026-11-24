import type { TokenSource } from './token-dictionary.ts'
import { normalizeTokenDict } from './internal/normalize-token-dict.ts'
import { trimAsciiWhitespace } from './internal/trim-ascii-whitespace.ts'
import { computeColorEmissiveTelemetry } from '../driven-emissive-oled/index.ts'

export interface OledPowerAuditReport {
  passed: boolean
  averagePowerMw: number
  averageAplPercent: number
  maxBlueStressToken: string
  maxBlueStressIndex: number
  trueBlackTokenCount: number
  nearBlackTokenCount: number
  totalTokensEvaluated: number
}

export const auditOledPower = (
  options: { maxAvgPowerMw?: number; maxBlueStress?: number } = {}
) => {
  const maxPowerThreshold = options.maxAvgPowerMw ?? 320
  const maxBlueThreshold = options.maxBlueStress ?? 65
  if (!Number.isFinite(maxPowerThreshold) || maxPowerThreshold < 0) {
    throw new Error(`Invalid maxAvgPowerMw threshold: ${maxPowerThreshold}. Expected a non-negative finite number.`)
  }
  if (!Number.isFinite(maxBlueThreshold) || maxBlueThreshold < 0) {
    throw new Error(`Invalid maxBlueStress threshold: ${maxBlueThreshold}. Expected a non-negative finite number.`)
  }

  return (dict: TokenSource): OledPowerAuditReport => {
    const normalized = normalizeTokenDict(dict)
    const entries = Object.entries(normalized).filter(
      ([, v]) => typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimAsciiWhitespace(v))
    )
    if (entries.length === 0) {
      return {
        passed: true,
        averagePowerMw: 0,
        averageAplPercent: 0,
        maxBlueStressToken: 'none',
        maxBlueStressIndex: 0,
        trueBlackTokenCount: 0,
        nearBlackTokenCount: 0,
        totalTokensEvaluated: 0,
      }
    }

    let sumPower = 0
    let sumApl = 0
    let maxBlue = -1
    let maxBlueKey = entries[0][0]
    let trueBlackCount = 0
    let nearBlackCount = 0

    for (const [k, hex] of entries) {
      const t = computeColorEmissiveTelemetry(hex)
      sumPower += t.powerMw
      sumApl += t.aplPercent
      if (t.isPixelOff) trueBlackCount++
      else if (t.emitterState === 'near-black') nearBlackCount++
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
      nearBlackTokenCount: nearBlackCount,
      totalTokensEvaluated: entries.length,
    }
  }
}
