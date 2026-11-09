/**
 * 落地页三模型公平评测矩阵（协议 v2）
 */

import {
  buildBenchmarkMatrix as buildCoreMatrix,
  type BenchmarkMatrixRowId,
} from '../color/benchmark.ts'
import type { MessageKey } from '../i18n/messages/en.ts'
import type { ModelComparisonResult } from '../color/benchmark.ts'

const RowI18n: Record<
  BenchmarkMatrixRowId,
  { labelKey: MessageKey; descKey: MessageKey; criteriaKeys: readonly MessageKey[] }
> = {
  toneDelta: {
    labelKey: 'benchmarks.row.toneDelta',
    descKey: 'benchmarks.row.toneDeltaDesc',
    criteriaKeys: [
      'benchmarks.criteria.toneDelta.a',
      'benchmarks.criteria.toneDelta.b',
      'benchmarks.criteria.toneDelta.c',
    ],
  },
  meanDrift: {
    labelKey: 'benchmarks.row.meanDrift',
    descKey: 'benchmarks.row.meanDriftDesc',
    criteriaKeys: [
      'benchmarks.criteria.meanDrift.a',
      'benchmarks.criteria.meanDrift.b',
      'benchmarks.criteria.meanDrift.c',
    ],
  },
  maxDrift: {
    labelKey: 'benchmarks.row.maxDrift',
    descKey: 'benchmarks.row.maxDriftDesc',
    criteriaKeys: [
      'benchmarks.criteria.maxDrift.a',
      'benchmarks.criteria.maxDrift.b',
      'benchmarks.criteria.maxDrift.c',
    ],
  },
  semanticContrast: {
    labelKey: 'benchmarks.row.wcag',
    descKey: 'benchmarks.row.wcagDesc',
    criteriaKeys: [
      'benchmarks.criteria.wcag.a',
      'benchmarks.criteria.wcag.b',
      'benchmarks.criteria.wcag.c',
    ],
  },
  solveTime: {
    labelKey: 'benchmarks.row.solveTime',
    descKey: 'benchmarks.row.solveTimeDesc',
    criteriaKeys: [
      'benchmarks.criteria.solveTime.a',
      'benchmarks.criteria.solveTime.b',
      'benchmarks.criteria.solveTime.c',
    ],
  },
}

export interface BenchmarkMatrixColumn {
  readonly id: string
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

export interface BenchmarkMatrix {
  readonly columns: readonly BenchmarkMatrixColumn[]
  readonly rows: readonly BenchmarkMatrixRow[]
}

export function buildBenchmarkMatrix(
  results: readonly ModelComparisonResult[],
): BenchmarkMatrix {
  const core = buildCoreMatrix(results)
  return {
    columns: core.columns,
    rows: core.rows.map((row) => {
      const i18n = RowI18n[row.id]
      return {
        labelKey: i18n.labelKey,
        descKey: i18n.descKey,
        criteriaKeys: i18n.criteriaKeys,
        condKey: 'benchmarks.cond.scale',
        cells: row.cells,
        bestIndex: row.bestIndex,
      }
    }),
  }
}
