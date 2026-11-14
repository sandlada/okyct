import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { selectStudioBenchmark } from './selectors.ts'

test('selectStudioBenchmark computes benchmark results and matrix from store state', () => {
  const store = createAppStore()
  const out = selectStudioBenchmark(store.getState())
  assert.equal(out.results.length, 3)
  assert.ok(out.matrix.rows.length > 0)
})
