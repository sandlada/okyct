import test from 'node:test'
import assert from 'node:assert/strict'
import {
  runModelBenchmark,
  runSpectrumSweep,
  runThroughputBenchmark,
} from './run.ts'

test('run.ts executes model benchmark, spectrum sweep, and throughput benchmark', () => {
  const models = runModelBenchmark('#2563EB')
  assert.equal(models.length, 3)
  const sweep = runSpectrumSweep(30)
  assert.equal(sweep.length, 24)
  const throughput = runThroughputBenchmark('#2563EB')
  assert.equal(throughput.length, 3)
})
