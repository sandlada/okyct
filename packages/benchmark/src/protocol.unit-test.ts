import test from 'node:test'
import assert from 'node:assert/strict'
import { BenchmarkProtocolVersion, StandardBenchmarkTones } from './protocol.ts'

test('protocol defines version 2.0 and 10 standard benchmark tones', () => {
  assert.equal(BenchmarkProtocolVersion, '2.0')
  assert.deepEqual(StandardBenchmarkTones, [10, 20, 30, 40, 50, 60, 70, 80, 90, 95])
})
