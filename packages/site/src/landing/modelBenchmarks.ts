/**
 * 落地页三模型公平评测矩阵（协议 v2）
 */

import type { MessageKey } from '../i18n/messages/en.ts'
import type {
  BenchmarkModelId,
  ModelComparisonResult,
} from '../color/benchmark.ts'

export const BenchmarkColumnOrder = ['okyct', 'google-mcu', 'culori'] as const

const BenchmarkColumnSubs: Record<BenchmarkModelId, string> = {
  okyct: 'CIE L* + okyctToRgb',
  'google-mcu': 'HCT tone solve',
  culori: 'OKLCH L* solve',
}

export interface BenchmarkMatrixColumn {
  readonly id: BenchmarkModelId
  readonly name: string
  readonly sub: string
}

export interface BenchmarkMatrixRow {
  readonly labelKey: MessageKey
  readonly descKey: MessageKey
  readonly criteriaKeys: readonly MessageKey[]
  readonly condKey: MessageKey
  readonly cells: readonly string[]
  readonly bestIndex: number
}

const BenchmarkRowCriteriaKeys: Record<string, readonly MessageKey[]> = {
  'benchmarks.row.toneDelta': [
    'benchmarks.criteria.toneDelta.a',
    'benchmarks.criteria.toneDelta.b',
    'benchmarks.criteria.toneDelta.c',
  ],
  'benchmarks.row.meanDrift': [
    'benchmarks.criteria.meanDrift.a',
    'benchmarks.criteria.meanDrift.b',
    'benchmarks.criteria.meanDrift.c',
  ],
  'benchmarks.row.maxDrift': [
    'benchmarks.criteria.maxDrift.a',
    'benchmarks.criteria.maxDrift.b',
    'benchmarks.criteria.maxDrift.c',
  ],
  'benchmarks.row.wcag': [
    'benchmarks.criteria.wcag.a',
    'benchmarks.criteria.wcag.b',
    'benchmarks.criteria.wcag.c',
  ],
  'benchmarks.row.solveTime': [
    'benchmarks.criteria.solveTime.a',
    'benchmarks.criteria.solveTime.b',
    'benchmarks.criteria.solveTime.c',
  ],
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

export function buildBenchmarkMatrix(
  results: readonly ModelComparisonResult[],
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

  interface RowSpec {
    readonly labelKey: MessageKey
    readonly descKey: MessageKey
    readonly condKey: MessageKey
    readonly values: readonly number[]
    readonly format: (value: number) => string
    readonly better: 'min' | 'max'
  }

  const contrastLightPass = ordered.map(
    (r) => r.semanticContrast.light.passCount,
  )
  const contrastDarkPass = ordered.map(
    (r) => r.semanticContrast.dark.pairCount > 0
      ? r.semanticContrast.dark.passCount
      : 0,
  )
  const contrastPairCount = ordered[0]?.semanticContrast.light.pairCount ?? 11

  const specs: readonly RowSpec[] = [
    {
      labelKey: 'benchmarks.row.toneDelta',
      descKey: 'benchmarks.row.toneDeltaDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((r) => r.deltaLStarP95),
      format: (v) => `p95 Δ${v.toFixed(2)}`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.meanDrift',
      descKey: 'benchmarks.row.meanDriftDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((r) => r.weightedHueMean.oklab),
      format: (v) => `${v.toFixed(2)}° w`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.maxDrift',
      descKey: 'benchmarks.row.maxDriftDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((r) => r.weightedHueP95.oklab),
      format: (v) => `p95 ${v.toFixed(2)}°`,
      better: 'min',
    },
    {
      labelKey: 'benchmarks.row.wcag',
      descKey: 'benchmarks.row.wcagDesc',
      condKey: 'benchmarks.cond.scale',
      values: contrastLightPass.map((light, i) => light + contrastDarkPass[i]),
      format: (v) => String(v),
      better: 'max',
    },
    {
      labelKey: 'benchmarks.row.solveTime',
      descKey: 'benchmarks.row.solveTimeDesc',
      condKey: 'benchmarks.cond.scale',
      values: ordered.map((r) => r.computeTimeMedianMs),
      format: (v) => `${v.toFixed(2)} ms`,
      better: 'min',
    },
  ]

  return {
    columns,
    rows: specs.map((spec) => ({
      labelKey: spec.labelKey,
      descKey: spec.descKey,
      criteriaKeys: BenchmarkRowCriteriaKeys[spec.labelKey] ?? [],
      condKey: spec.condKey,
      cells:
        spec.labelKey === 'benchmarks.row.wcag'
          ? ordered.map(
              (r) =>
                `L ${r.semanticContrast.light.passCount}/${contrastPairCount} · D ${r.semanticContrast.dark.passCount}/${contrastPairCount}`,
            )
          : spec.values.map(spec.format),
      bestIndex: findBestIndex(spec.values, spec.better),
    })),
  }
}
