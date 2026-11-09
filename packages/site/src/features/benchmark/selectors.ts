import { createSelector } from '@reduxjs/toolkit'
import { runModelBenchmark } from '../../color/benchmark.ts'
import type { RootState } from '../../app/store.ts'
import { buildBenchmarkMatrix } from './matrix.ts'

export const selectStudioBenchmark = createSelector(
  [(state: RootState) => state.studio.settledSourceHex, (state: RootState) => state.benchmark.yellowMode],
  (sourceHex, yellowMode) => {
    const results = runModelBenchmark(sourceHex)
    return {
      sourceHex,
      yellowMode,
      results,
      matrix: buildBenchmarkMatrix(results),
    }
  },
)
