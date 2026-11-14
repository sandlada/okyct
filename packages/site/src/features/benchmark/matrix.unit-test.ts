import test from 'node:test'
import assert from 'node:assert/strict'
import { runModelBenchmark } from '../../color/benchmark.ts'
import { buildBenchmarkMatrix } from './matrix.ts'

test('benchmark/matrix builds matrix columns and rows from benchmark results', () => {
  const results = runModelBenchmark('#2563EB')
  const matrix = buildBenchmarkMatrix(results)
  assert.equal(matrix.columns.length, 3)
  assert.ok(matrix.rows.length > 0)
})
