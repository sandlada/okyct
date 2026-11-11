/**
 * 三模型评测矩阵（协议 v2，与落地页一致）
 */

import type {
  BenchmarkModelId,
  ModelComparisonResult,
} from './types.ts'

export const BenchmarkColumnOrder = ['okyct', 'google-mcu', 'culori'] as const

const BenchmarkColumnSubs: Record<BenchmarkModelId, string> = {
  okyct: 'CIE L* + okyctToRgb',
  'google-mcu': 'HCT tone solve',
  culori: 'OKLCH L* solve',
}

export type BenchmarkMatrixRowId =
  | 'toneDelta'
  | 'meanDrift'
  | 'maxDrift'
  | 'semanticContrast'
  | 'solveTime'

export interface BenchmarkMatrixColumn {
  readonly id: BenchmarkModelId
  readonly name: string
  readonly sub: string
}

export interface BenchmarkMatrixRow {
  readonly id: BenchmarkMatrixRowId
  readonly cond: string
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

  const contrastLightPass = ordered.map((r) => r.semanticContrast.light.passCount)
  const contrastDarkPass = ordered.map((r) => r.semanticContrast.dark.passCount)
  const contrastPairCount = ordered[0]?.semanticContrast.light.pairCount ?? 11
  const cond = 'T10–T95 · CIE L* grid (protocol v2)'

  const rows: BenchmarkMatrixRow[] = [
    {
      id: 'toneDelta',
      cond,
      cells: ordered.map((r) => `p95 Δ${r.deltaLStarP95.toFixed(2)}`),
      bestIndex: findBestIndex(
        ordered.map((r) => r.deltaLStarP95),
        'min',
      ),
    },
    {
      id: 'meanDrift',
      cond,
      cells: ordered.map((r) => `${r.weightedHueMean.oklab.toFixed(2)}° w`),
      bestIndex: findBestIndex(
        ordered.map((r) => r.weightedHueMean.oklab),
        'min',
      ),
    },
    {
      id: 'maxDrift',
      cond,
      cells: ordered.map((r) => `p95 ${r.weightedHueP95.oklab.toFixed(2)}°`),
      bestIndex: findBestIndex(
        ordered.map((r) => r.weightedHueP95.oklab),
        'min',
      ),
    },
    {
      id: 'semanticContrast',
      cond,
      cells: ordered.map(
        (r) =>
          `L ${r.semanticContrast.light.passCount}/${contrastPairCount} · D ${r.semanticContrast.dark.passCount}/${contrastPairCount}`,
      ),
      bestIndex: findBestIndex(
        contrastLightPass.map((light, i) => light + contrastDarkPass[i]),
        'max',
      ),
    },
    {
      id: 'solveTime',
      cond,
      cells: ordered.map((r) => `${r.computeTimeMedianMs.toFixed(2)} ms`),
      bestIndex: findBestIndex(
        ordered.map((r) => r.computeTimeMedianMs),
        'min',
      ),
    },
  ]

  return { columns, rows }
}
