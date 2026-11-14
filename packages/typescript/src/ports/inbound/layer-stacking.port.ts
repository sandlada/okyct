/**
 * [Hexagonal Layer: Inbound Port]
 * N 层颜色物理/感知叠加与状态层合成驱动端契约 (一个口对应一个文件)
 * 约束：仅依赖 domain/models
 */

import type { OKYCT } from '../../domain/models/index.ts'

export interface ColorLayer {
  color: string
  opacity: number
  label?: string
}

export interface LayerStepTrace {
  stepIndex: number
  label: string
  layerColor: string
  layerOpacity: number
  accumulatedHex: string
  accumulatedOkyct: OKYCT
  wcagContrastWithWhite: number
  wcagContrastWithBlack: number
}

export interface CompositedResult {
  baseColor: string
  totalLayers: number
  finalHex: string
  finalOkyct: OKYCT
  traces: LayerStepTrace[]
  blendSpace: 'linear-srgb' | 'gamma-srgb' | 'okyct'
}

export interface StackOptions {
  blendSpace?: 'linear-srgb' | 'gamma-srgb' | 'okyct'
}

export interface StackedContrastReport {
  foregroundHex: string
  finalBackgroundHex: string
  wcagRatio: number
  wcagPassAA: boolean
  wcagPassAAA: boolean
  apcaLc: number
  deltaToneFromBase: number
  warningMessage?: string
  recommendedCompensationTone?: number | null
}

export interface ILayerStackingPort {
  stackLayers(
    options?: StackOptions
  ): (layers: readonly ColorLayer[]) => (baseColor: string) => CompositedResult

  stackStateLayers(
    states: Array<'hovered' | 'focused' | 'pressed' | 'dragged' | 'hover' | 'focus'>
  ): (pair: { base: string; stateColor: string }) => CompositedResult

  auditStackedContrast(
    foregroundHex: string
  ): (composited: CompositedResult) => StackedContrastReport

  stackToCssColorMix(
    options?: { space?: 'oklch' | 'srgb' }
  ): (layers: ReadonlyArray<{ color: string; opacity: number }>) => (baseExpr: string) => string
}
