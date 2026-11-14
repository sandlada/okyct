import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BenchmarkProtocolVersion,
  calculateAngleDelta,
  runModelBenchmark,
} from './runners.ts'

test('runners barrel exports benchmark runners and protocol version', () => {
  assert.equal(BenchmarkProtocolVersion, '2.0')
  assert.equal(calculateAngleDelta(10, 350), 20)
  assert.equal(runModelBenchmark('#2563EB').length, 3)
})
