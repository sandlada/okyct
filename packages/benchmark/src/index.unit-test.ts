import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BenchmarkModelIds,
  BenchmarkProtocolVersion,
  buildBenchmarkMatrix,
  runModelBenchmark,
  simulateCvd,
} from './index.ts'

test('benchmark index barrel exports types, runners, cvd, and matrix builders', () => {
  assert.deepEqual(BenchmarkModelIds, ['okyct', 'google-mcu', 'culori'])
  assert.equal(BenchmarkProtocolVersion, '2.0')
  assert.equal(typeof runModelBenchmark, 'function')
  assert.equal(typeof buildBenchmarkMatrix, 'function')
  assert.equal(typeof simulateCvd, 'function')
})
