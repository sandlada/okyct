/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 落地页基准矩阵组装：把 @sandlada/benchmark 的实测结果整理成
 * Gemini 式对照表（行 = 评测项，列 = 五个真实模型实现，最优值加粗）。
 */

import type { MessageKey } from '../i18n/messages/en.ts'
import type {
  BenchmarkModelId,
  ModelComparisonResult,
  SpectrumSweepPoint,
} from '../color/benchmark.ts'

export const BenchmarkColumnOrder = ['okyct', 'google-mcu', 'culori', 'antd-colors', 'hsl'] as const

const BenchmarkColumnSubs: Record<BenchmarkModelId, string> = {
  okyct: 'Newton tangent',
  'google-mcu': 'CAM16 bisection',
  culori: 'OKLCH clampChroma',
  'antd-colors': 'HSV steps',
  hsl: 'Polar coords',
}

const SweepDriftPickers = [
  (point: SpectrumSweepPoint) => point.okyct.drift,
  (point: SpectrumSweepPoint) => point.googleMcu.drift,
  (point: SpectrumSweepPoint) => point.culori.drift,
  (point: SpectrumSweepPoint) => point.antdColors.drift,
  (point: SpectrumSweepPoint) => point.hsl.drift,
] as const

export interface BenchmarkMatrixColumn {
  readonly id: BenchmarkModelId
  readonly name: string
  readonly sub: string
}

export interface BenchmarkMatrixRow {
  readonly labelKey: MessageKey
  readonly descKey: MessageKey
  readonly condKey: MessageKey
  readonly cells: readonly string[]
  readonly bestIndex: number
}

export interface BenchmarkMatrix {
  readonly columns: readonly BenchmarkMatrixColumn[]
  readonly rows: readonly BenchmarkMatrixRow[]
}

function findBestIndex(values: readonly number[], better: 'min' | 'max'): number {
  let best = -1
  for (let index = 0; index < values.length; index += 1) {
    if (best === -1) {
      best = index
      continue
    }
    if (better === 'min' ? values[index] < values[best] : values[index] > values[best]) {
      best = index
    }
  }
  return best
}

function sweepMax(
  sweep: readonly SpectrumSweepPoint[],
  pick: (point: SpectrumSweepPoint) => number,
): number {
  return Math.max(...sweep.map(pick))
}

export function buildBenchmarkMatrix(
  results: readonly ModelComparisonResult[],
  sweep: readonly SpectrumSweepPoint[],
): BenchmarkMatrix {
  const byId = new Map<BenchmarkModelId, ModelComparisonResult>()
  for (const result of results) {
    byId.set(result.modelId, result)
  }
  const columns = BenchmarkColumnOrder.map((id) => {
    const result = byId.get(id)
    if (!result) {
      throw new Error(`Missing benchmark result for model ${id}`)
    }
    return { id, name: result.shortName, sub: BenchmarkColumnSubs[id] }
  })
  const ordered = BenchmarkColumnOrder.map((id) => byId.get(id) as ModelComparisonResult)
  const blueSweep = sweep.filter((point) => point.targetHue >= 240 && point.targetHue <= 300)

  interface RowSpec {
    readonly labelKey: MessageKey
    readonly descKey: MessageKey
    readonly condKey: MessageKey
    readonly values: readonly number[]
    readonly format: (value: number) => string
    readonly better: 'min' | 'max'
  }

  const specs: readonly RowSpec[] = [
    {
      labelKey: 'benchmarks.row.maxDrift',
      descKey: 'benchmarks.row.maxDriftDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.maxHueDriftDeg),
      format: (value) => `${value.toFixed(1)}°`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.meanDrift',
      descKey: 'benchmarks.row.meanDriftDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.meanHueDriftDeg),
      format: (value) => `${value.toFixed(2)}°`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.wcag',
      descKey: 'benchmarks.row.wcagDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.wcagAaPassRate),
      format: (value) => `${value}%`,
      better: 'max',
    },
    {
      labelKey: 'benchmarks.row.toneDelta',
      descKey: 'benchmarks.row.toneDeltaDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.maxToneDelta),
      format: (value) => `Δ${value.toFixed(1)}`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.solveTime',
      descKey: 'benchmarks.row.solveTimeDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.computeTimeMs),
      format: (value) => `${value.toFixed(2)} ms`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.speedup',
      descKey: 'benchmarks.row.speedupDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.relativeSpeedup),
      format: (value) => `${value.toFixed(2)}×`,
      better: 'max',
    },
    {
      labelKey: 'benchmarks.row.compliance',
      descKey: 'benchmarks.row.complianceDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.complianceRate),
      format: (value) => `${value.toFixed(1)}%`,
      better: 'max',
    },
    {
      labelKey: 'benchmarks.row.severe',
      descKey: 'benchmarks.row.severeDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((result) => result.severeDistortionCount),
      format: (value) => `${value}`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.ringDrift',
      descKey: 'benchmarks.row.ringDriftDesc',
      condKey: 'benchmarks.cond.sweep',
      values: SweepDriftPickers.map((pick) => sweepMax(sweep, pick)),
      format: (value) => `${value.toFixed(1)}°`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.blueDrift',
      descKey: 'benchmarks.row.blueDriftDesc',
      condKey: 'benchmarks.cond.blue',
      values: SweepDriftPickers.map((pick) => sweepMax(blueSweep, pick)),
      format: (value) => `${value.toFixed(1)}°`,
      better: 'min',
    },
  ]

  return {
    columns,
    rows: specs.map((spec) => ({
      labelKey: spec.labelKey,
      descKey: spec.descKey,
      condKey: spec.condKey,
      cells: spec.values.map(spec.format),
      bestIndex: findBestIndex(spec.values, spec.better),
    })),
  }
}
