/**
 * @sandlada/benchmark 公共运行入口（协议 v2，三模型）
 */

export { BenchmarkProtocolVersion } from './protocol.ts'

export {
  StandardBenchmarkTones,
  buildSeedSuite,
  seedSuiteHash,
  runModelBenchmark,
  runSpectrumSweep,
  runThroughputBenchmark,
  runFullSeedSuiteBenchmark,
} from './run.ts'

export { shortestHueDeltaDeg as calculateAngleDelta } from './referee/cielab.ts'
