/**
 * 三模型公平评测类型（协议 v2）
 */

export const BenchmarkModelIds = ['okyct', 'google-mcu', 'culori'] as const

export type BenchmarkModelId = (typeof BenchmarkModelIds)[number]

export interface WeightedHueAggregate {
  readonly cielab: number
  readonly oklab: number
  readonly hct: number
}

export interface ModelColorStop {
  stopName: string
  targetLStar: number
  hex: string
  actualLStar: number
  deltaLStar: number
  actualTone: number
  weightedHueDeg: WeightedHueAggregate
  hueExcluded: boolean
  alreadyQuantized: boolean
}

export interface ContrastGateRow {
  readonly pair: string
  readonly wcag: number
  readonly apca: number
  readonly passesAa: boolean
}

export interface SemanticContrastThemeGate {
  readonly passCount: number
  readonly pairCount: number
  readonly gates: readonly ContrastGateRow[]
}

export interface SemanticContrastModeResult {
  readonly light: SemanticContrastThemeGate
  readonly dark: SemanticContrastThemeGate
}

export interface ModelComparisonResult {
  modelId: BenchmarkModelId
  modelName: string
  shortName: string
  description: string
  stops: ModelColorStop[]
  deltaLStarMean: number
  deltaLStarP95: number
  weightedHueMean: WeightedHueAggregate
  weightedHueP95: WeightedHueAggregate
  hueExcluded: boolean
  hueSpaceDependent?: boolean
  semanticContrast: SemanticContrastModeResult
  computeTimeMedianMs: number
}

export interface SpectrumSweepPoint {
  targetHue: number
  seedHex: string
  okyct: SpectrumModelCell
  googleMcu: SpectrumModelCell
  culori: SpectrumModelCell
}

export interface SpectrumModelCell {
  hex: string
  measuredHue: number
  drift: number
  tone: number
  deltaLStar: number
}

export interface ThroughputBenchmarkItem {
  modelId: BenchmarkModelId
  modelName: string
  iterations: number
  totalMs: number
  medianMsPerRamp: number
}

export const CvdTypes = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
] as const

export type CvdType = (typeof CvdTypes)[number]
