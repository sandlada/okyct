import { createSelector } from '@reduxjs/toolkit'
import { buildBenchmarkMatrix, type BenchmarkMatrix } from '../benchmark/matrix.ts'
import { runModelBenchmark } from '../../color/benchmark.ts'
import type { RootState } from '../../app/store.ts'
import { buildLandingPalette, buildPanelSwatches, buildTerrainRoleRamps } from './palette.ts'

const selectSeed = (state: RootState) => state.landing.seedHex
const selectDark = (state: RootState) => state.theme.mode === 'dark'

export const selectLandingScreen = createSelector(
  [selectSeed, selectDark],
  (seedHex, isDark) => {
    const palette = buildLandingPalette(seedHex)
    const benchmarks = runModelBenchmark(seedHex)
    const brandColors = [
      palette.accents.primary,
      palette.accents.secondary,
      palette.accents.tertiary,
    ] as const
    return {
      seedHex,
      isDark,
      palette,
      terrainRoles: buildTerrainRoleRamps(seedHex, isDark),
      panels: buildPanelSwatches(seedHex),
      benchmarkMatrix: buildBenchmarkMatrix(benchmarks) satisfies BenchmarkMatrix,
      brandColors,
      gradient: `linear-gradient(96deg, ${palette.accents.primary} 0%, ${palette.accents.secondary} 42%, ${palette.accents.tertiary} 78%, ${palette.accents.primary} 100%)`,
    }
  },
)
