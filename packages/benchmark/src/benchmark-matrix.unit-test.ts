import test from 'node:test'
import assert from 'node:assert/strict'
import { BenchmarkColumnOrder, buildBenchmarkMatrix } from './benchmark-matrix.ts'
import { runModelBenchmark } from './run.ts'

test('buildBenchmarkMatrix constructs comparison rows across okyct, google-mcu, culori', () => {
  assert.deepEqual(BenchmarkColumnOrder, ['okyct', 'google-mcu', 'culori'])
  const results = runModelBenchmark('#2563EB')
  const matrix = buildBenchmarkMatrix(results)
  assert.equal(matrix.columns.length, 3)
  assert.ok(matrix.rows.length > 0)
})
