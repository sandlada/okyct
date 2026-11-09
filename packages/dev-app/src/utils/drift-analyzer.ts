/**
 * OKYCT Dev-App — 三模型公平 Hue / L* 分析
 */

import { hexToOkyct } from '@sandlada/okyct'
import {
  runModelBenchmark,
  runSpectrumSweep,
  BenchmarkProtocolVersion,
  type ModelComparisonResult,
  type SpectrumSweepPoint,
} from '@sandlada/benchmark'

export interface RampComparisonStop {
  tone: number
  okyct: ModelCell
  googleMcu: ModelCell
  culori: ModelCell
}

export interface ModelCell {
  hex: string
  hue: number
  drift: number
  tone: number
  deltaLStar: number
}

export interface RampAnalysisResult {
  protocolVersion: string
  sourceHex: string
  sourceHue: number
  hueSpaceDependent: boolean
  stops: RampComparisonStop[]
  summaries: ModelComparisonResult[]
}

export interface StressPreset {
  id: string
  name: string
  hex: string
  reason: string
}

export const StressPresets: ReadonlyArray<StressPreset> = [
  { id: 'blue', name: '纯蓝', hex: '#0000FF', reason: '蓝紫 Abney 效应区' },
  { id: 'red', name: '鲜红', hex: '#FF0000', reason: '红区 Cusp 折返' },
  { id: 'yellow', name: '柠檬黄', hex: '#FFD600', reason: '高光过曝区' },
  { id: 'magenta', name: '洋红', hex: '#FF00FF', reason: '非光谱色边界' },
]

export function analyzeRampHueDrift(sourceHex: string): RampAnalysisResult {
  const sourceOkyct = hexToOkyct(sourceHex)
  const summaries = runModelBenchmark(sourceHex)
  const okyctResult = summaries.find((m) => m.modelId === 'okyct')!
  const mcuResult = summaries.find((m) => m.modelId === 'google-mcu')!
  const culoriResult = summaries.find((m) => m.modelId === 'culori')!

  const evalTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95]
  const stops: RampComparisonStop[] = evalTones.map((tone, idx) => {
    const toCell = (stop: (typeof okyctResult.stops)[number]): ModelCell => ({
      hex: stop.hex,
      hue: parseFloat(hexToOkyct(stop.hex).h.toFixed(1)),
      drift: stop.weightedHueDeg.oklab,
      tone: stop.actualTone,
      deltaLStar: stop.deltaLStar,
    })
    return {
      tone,
      okyct: toCell(okyctResult.stops[idx]),
      googleMcu: toCell(mcuResult.stops[idx]),
      culori: toCell(culoriResult.stops[idx]),
    }
  })

  return {
    protocolVersion: BenchmarkProtocolVersion,
    sourceHex: sourceHex.toUpperCase(),
    sourceHue: parseFloat(sourceOkyct.h.toFixed(1)),
    hueSpaceDependent: summaries.some((s) => s.hueSpaceDependent),
    stops,
    summaries,
  }
}

export function scanSpectrumHueDrift(
  testChroma = 0.3,
  testLStar = 50,
): SpectrumSweepPoint[] {
  void testChroma
  return runSpectrumSweep(0.3, testLStar)
}
