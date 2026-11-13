/**
 * 三模型公平评测入口
 */

import { hexToOkyct } from '@sandlada/okyct'
import { argbFromHex, Hct } from '@material/material-color-utilities'

import { generateOkyctFairStops } from './adapters/okyct.ts'
import { generateCuloriFairStops } from './adapters/culori.ts'
import { generateMcuFairStops } from './adapters/mcu.ts'
import {
  cielabChroma,
  cielabHueDeg,
  hexToCielab,
} from './referee/cielab.ts'
import {
  enrichStop,
  evaluateSemanticContrastGates,
  isHueRankingSpaceDependent,
  mean,
  percentile95,
} from './metrics.ts'
import { generateOkyctSemanticRoles } from './role-scheme/generate-okyct-roles.ts'
import { generateMcuSemanticRoles } from './role-scheme/generate-mcu-roles.ts'
import { generateCuloriSemanticRoles } from './role-scheme/generate-culori-roles.ts'
import { StandardBenchmarkTones, BenchmarkProtocolVersion } from './protocol.ts'
import { buildSeedSuite, seedSuiteHash } from './seeds.ts'
import type {
  BenchmarkModelId,
  ModelColorStop,
  ModelComparisonResult,
  SpectrumSweepPoint,
  ThroughputBenchmarkItem,
} from './types.ts'

export { StandardBenchmarkTones, BenchmarkProtocolVersion }
export { buildSeedSuite, seedSuiteHash }

type FairGenerator = (seedHex: string, tones: readonly number[]) => ReturnType<
  typeof generateOkyctFairStops
>

type SemanticRoleGenerator = (seedHex: string) => ReturnType<typeof generateOkyctSemanticRoles>

const SemanticRoleGenerators: Record<BenchmarkModelId, SemanticRoleGenerator> = {
  okyct: generateOkyctSemanticRoles,
  'google-mcu': generateMcuSemanticRoles,
  culori: generateCuloriSemanticRoles,
}

const ModelCatalog: {
  id: BenchmarkModelId
  modelName: string
  shortName: string
  description: string
  generate: FairGenerator
}[] = [
  {
    id: 'okyct',
    modelName: '自研 OKYCT 模型',
    shortName: 'OKYCT',
    description: 'CIE L* 目标 + TonalPalette 包络 + okyctToRgb + 共享 quantizeNearest。',
    generate: generateOkyctFairStops,
  },
  {
    id: 'google-mcu',
    modelName: 'Google MCU (HCT)',
    shortName: 'Google MCU',
    description: 'HCT tone 二分命中 L*；原生 8-bit ARGB（alreadyQuantized）。',
    generate: generateMcuFairStops,
  },
  {
    id: 'culori',
    modelName: 'culori (OKLCH)',
    shortName: 'culori',
    description: 'OKLCH h/c 固定 + L 二分命中 L* + clampChroma + 共享 quantizeNearest。',
    generate: generateCuloriFairStops,
  },
]

function seedReferenceHues(seedHex: string) {
  const seedLab = hexToCielab(seedHex)
  const seedOky = hexToOkyct(seedHex)
  const seedHct = Hct.fromInt(argbFromHex(seedHex))
  return {
    cielabHue: cielabHueDeg(seedLab),
    oklabHue: seedOky.h,
    hctHue: seedHct.hue,
    cielabChroma: cielabChroma(seedLab),
  }
}

function buildStops(
  seedHex: string,
  generate: FairGenerator,
): ModelColorStop[] {
  const ref = seedReferenceHues(seedHex)
  const raw = generate(seedHex, StandardBenchmarkTones)
  return raw.map((r) =>
    enrichStop(
      r.targetLStar,
      r.hex,
      ref.cielabHue,
      ref.oklabHue,
      ref.hctHue,
      ref.cielabChroma,
      r.alreadyQuantized,
    ),
  )
}

function medianMs(samples: readonly number[]): number {
  const sorted = [...samples].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export function runModelBenchmark(sourceHex: string): ModelComparisonResult[] {
  const timingRuns = 20
  const batchSize = 10
  const results: ModelComparisonResult[] = []

  for (const model of ModelCatalog) {
    for (let w = 0; w < 3; w++) buildStops(sourceHex, model.generate)
    const timings: number[] = []
    for (let i = 0; i < timingRuns; i++) {
      const t0 = performance.now()
      for (let b = 0; b < batchSize; b++) {
        buildStops(sourceHex, model.generate)
      }
      timings.push((performance.now() - t0) / batchSize)
    }

    const stops = buildStops(sourceHex, model.generate)
    const hueExcluded = stops.every((s) => s.hueExcluded)
    const deltaLs = stops.map((s) => s.deltaLStar)
    const wCielab = stops.filter((s) => !s.hueExcluded).map((s) => s.weightedHueDeg.cielab)
    const wOklab = stops.filter((s) => !s.hueExcluded).map((s) => s.weightedHueDeg.oklab)
    const wHct = stops.filter((s) => !s.hueExcluded).map((s) => s.weightedHueDeg.hct)

    const aggHue = {
      cielab: mean(wCielab),
      oklab: mean(wOklab),
      hct: mean(wHct),
    }

    results.push({
      modelId: model.id,
      modelName: model.modelName,
      shortName: model.shortName,
      description: model.description,
      stops,
      deltaLStarMean: parseFloat(mean(deltaLs).toFixed(3)),
      deltaLStarP95: parseFloat(percentile95(deltaLs).toFixed(3)),
      weightedHueMean: {
        cielab: parseFloat(aggHue.cielab.toFixed(3)),
        oklab: parseFloat(aggHue.oklab.toFixed(3)),
        hct: parseFloat(aggHue.hct.toFixed(3)),
      },
      weightedHueP95: {
        cielab: parseFloat(percentile95(wCielab).toFixed(3)),
        oklab: parseFloat(percentile95(wOklab).toFixed(3)),
        hct: parseFloat(percentile95(wHct).toFixed(3)),
      },
      hueExcluded,
      semanticContrast: evaluateSemanticContrastGates(
        SemanticRoleGenerators[model.id](sourceHex),
      ),
      computeTimeMedianMs: parseFloat(medianMs(timings).toFixed(3)),
    })
  }

  const hueMeans = results
    .filter((r) => !r.hueExcluded)
    .map((r) => r.weightedHueMean)
  const spaceDependent = isHueRankingSpaceDependent(hueMeans)
  for (const r of results) {
    r.hueSpaceDependent = spaceDependent
  }

  return results
}

export function runSpectrumSweep(
  _testChroma = 0.3,
  testLStar = 50,
): SpectrumSweepPoint[] {
  const seeds = buildSeedSuite().filter((hex) => cielabChroma(hexToCielab(hex)) >= 2)
  return seeds.slice(0, 24).map((seedHex) => {
    const ref = seedReferenceHues(seedHex)
    const tones = [testLStar] as const
    const oky = buildStops(seedHex, generateOkyctFairStops).find(
      (s) => s.targetLStar === testLStar,
    )!
    const mcu = buildStops(seedHex, generateMcuFairStops).find(
      (s) => s.targetLStar === testLStar,
    )!
    const cul = buildStops(seedHex, generateCuloriFairStops).find(
      (s) => s.targetLStar === testLStar,
    )!

    const pack = (s: ModelColorStop) => ({
      hex: s.hex,
      measuredHue: parseFloat(hexToOkyct(s.hex).h.toFixed(1)),
      drift: parseFloat(s.weightedHueDeg.oklab.toFixed(2)),
      tone: s.actualTone,
      deltaLStar: s.deltaLStar,
    })

    void ref
    void tones
    return {
      targetHue: parseFloat(ref.cielabHue.toFixed(1)),
      seedHex,
      okyct: pack(oky),
      googleMcu: pack(mcu),
      culori: pack(cul),
    }
  })
}

export function runThroughputBenchmark(
  testHex = '#2563EB',
  iterations = 200,
): ThroughputBenchmarkItem[] {
  const results: ThroughputBenchmarkItem[] = []
  for (const model of ModelCatalog) {
    for (let w = 0; w < 3; w++) buildStops(testHex, model.generate)
    const t0 = performance.now()
    for (let i = 0; i < iterations; i++) {
      buildStops(testHex, model.generate)
    }
    const totalMs = performance.now() - t0
    results.push({
      modelId: model.id,
      modelName: model.modelName,
      iterations,
      totalMs: parseFloat(totalMs.toFixed(2)),
      medianMsPerRamp: parseFloat((totalMs / iterations).toFixed(3)),
    })
  }
  return results
}

export function runFullSeedSuiteBenchmark(): {
  protocolVersion: string
  seedSuiteHash: string
  seeds: string[]
  perSeed: Record<string, ModelComparisonResult[]>
} {
  const seeds = buildSeedSuite()
  const hash = seedSuiteHash(seeds)
  const perSeed: Record<string, ModelComparisonResult[]> = {}
  for (const seed of seeds) {
    perSeed[seed] = runModelBenchmark(seed)
  }
  return {
    protocolVersion: BenchmarkProtocolVersion,
    seedSuiteHash: hash,
    seeds,
    perSeed,
  }
}
