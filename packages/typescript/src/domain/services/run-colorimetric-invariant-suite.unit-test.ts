import test from 'node:test'
import assert from 'node:assert/strict'
import { runColorimetricInvariantSuite } from './run-colorimetric-invariant-suite.ts'

test('runColorimetricInvariantSuite passes all colorimetric mathematical invariants', () => {
  const results = runColorimetricInvariantSuite()
  assert.ok(results.length >= 3)
  for (const item of results) {
    assert.equal(item.passed, true, `${item.id}: ${item.measuredValue}`)
  }
})
