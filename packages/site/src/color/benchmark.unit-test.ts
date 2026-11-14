import test from 'node:test'
import assert from 'node:assert/strict'
import { BenchmarkProtocolVersion, runModelBenchmark } from './benchmark.ts'

test('color/benchmark facade re-exports @sandlada/benchmark runners', () => {
  assert.equal(BenchmarkProtocolVersion, '2.0')
  assert.equal(runModelBenchmark('#2563EB').length, 3)
})
