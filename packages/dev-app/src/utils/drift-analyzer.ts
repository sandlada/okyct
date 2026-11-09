/**
 * OKYCT Dev-App — Multi-Model Hue Drift & Angle Preservation Analyzer
 */

import { hexToOkyct } from '@sandlada/okyct'
import {
  runModelBenchmark,
  runSpectrumSweep,
  type ModelComparisonResult,
  type SpectrumSweepPoint,
} from '@sandlada/benchmark'

export interface RampComparisonStop {
  tone: number
  okyct: { hex: string; hue: number; drift: number; tone: number }
  googleMcu: { hex: string; hue: number; drift: number; tone: number }
  culori: { hex: string; hue: number; drift: number; tone: number }
  antdColors: { hex: string; hue: number; drift: number; tone: number }
  hsl: { hex: string; hue: number; drift: number; tone: number }
}

export interface RampAnalysisResult {
  sourceHex: string
  sourceHue: number
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
  {
    id: 'blue',
    name: '纯蓝',
    hex: '#0000FF',
    reason: '蓝紫 Abney 效应区',
  },
  {
    id: 'red',
    name: '鲜红',
    hex: '#FF0000',
    reason: '红区 Cusp 折返',
  },
  {
    id: 'yellow',
    name: '柠檬黄',
    hex: '#FFD600',
    reason: '高光过曝区',
  },
  {
    id: 'magenta',
    name: '洋红',
    hex: '#FF00FF',
    reason: '非光谱色边界',
  },
]

export function analyzeRampHueDrift(sourceHex: string): RampAnalysisResult {
  const sourceOkyct = hexToOkyct(sourceHex)
  const summaries = runModelBenchmark(sourceHex)

  const okyctResult = summaries.find((m) => m.modelId === 'okyct')!
  const mcuResult = summaries.find((m) => m.modelId === 'google-mcu')!
  const culoriResult = summaries.find((m) => m.modelId === 'culori')!
  const antdResult = summaries.find((m) => m.modelId === 'antd-colors')!
  const hslResult = summaries.find((m) => m.modelId === 'hsl')!

  const evalTones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95]
  const stops: RampComparisonStop[] = evalTones.map((tone, idx) => {
    const ok = okyctResult.stops[idx]
    const mcu = mcuResult.stops[idx]
    const cul = culoriResult.stops[idx]
    const antd = antdResult.stops[idx]
    const hs = hslResult.stops[idx]

    return {
      tone,
      okyct: {
        hex: ok.hex,
        hue: ok.oklabHue,
        drift: ok.oklabHueDrift,
        tone: ok.actualTone,
      },
      googleMcu: {
        hex: mcu.hex,
        hue: mcu.oklabHue,
        drift: mcu.oklabHueDrift,
        tone: mcu.actualTone,
      },
      culori: {
        hex: cul.hex,
        hue: cul.oklabHue,
        drift: cul.oklabHueDrift,
        tone: cul.actualTone,
      },
      antdColors: {
        hex: antd.hex,
        hue: antd.oklabHue,
        drift: antd.oklabHueDrift,
        tone: antd.actualTone,
      },
      hsl: {
        hex: hs.hex,
        hue: hs.oklabHue,
        drift: hs.oklabHueDrift,
        tone: hs.actualTone,
      },
    }
  })

  return {
    sourceHex: sourceHex.toUpperCase(),
    sourceHue: parseFloat(sourceOkyct.h.toFixed(1)),
    stops,
    summaries,
  }
}

export function scanSpectrumHueDrift(
  testChroma = 0.30,
  testTone = 50
): SpectrumSweepPoint[] {
  return runSpectrumSweep(testChroma, testTone)
}
