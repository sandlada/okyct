/**
 * @license
 * MIT License
 * Copyright (c) 2026 Kai-Orion & Sandlada
 *
 * OKYCT Multi-Model Benchmark Suite Types
 */

export const BenchmarkModelIds = [
  'okyct',
  'google-mcu',
  'culori',
  'antd-colors',
  'hsl',
] as const

export type BenchmarkModelId = (typeof BenchmarkModelIds)[number]

export interface ModelColorStop {
  stopName: string
  nominalValue: number
  hex: string
  actualY: number
  actualTone: number
  toneDelta: number
  oklabHue: number
  oklabHueDrift: number
}

export interface ModelComparisonResult {
  modelId: BenchmarkModelId
  modelName: string
  shortName: string
  description: string
  stops: ModelColorStop[]
  contrastPredictability: string
  blueHueStability: string
  computeOverhead: string
  wcagAaPassRate: number
  maxHueDriftDeg: number
  meanHueDriftDeg: number
  maxToneDelta: number
  computeTimeMs: number
  opsPerSec: number
  relativeSpeedup: number
  complianceRate: number // drift <= 0.5°
  severeDistortionCount: number // drift > 2.5°
}

export interface SpectrumSweepPoint {
  targetHue: number
  okyct: { hex: string; measuredHue: number; drift: number; tone: number }
  googleMcu: { hex: string; measuredHue: number; drift: number; tone: number }
  culori: { hex: string; measuredHue: number; drift: number; tone: number }
  antdColors: { hex: string; measuredHue: number; drift: number; tone: number }
  hsl: { hex: string; measuredHue: number; drift: number; tone: number }
  advantageOverMcu: number // MCU drift - OKYCT drift
}

export interface ThroughputBenchmarkItem {
  modelId: BenchmarkModelId
  modelName: string
  iterations: number
  totalMs: number
  usPerOp: number
  opsPerSec: number
  relativeSpeedup: number
}

export const CvdTypes = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
] as const

export type CvdType = (typeof CvdTypes)[number]
