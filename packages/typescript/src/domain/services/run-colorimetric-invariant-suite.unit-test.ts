import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runColorimetricInvariantSuite } from './run-colorimetric-invariant-suite.ts'

const ExpectedInvariantIds = [
  'round-trip',
  'tone-bijection',
  'hex-round-trip',
  'cusp-containment',
  'algebraic-contrast',
] as const

describe('runColorimetricInvariantSuite', () => {
  it('returns and passes all five colorimetric mathematical invariant suites with full metadata', () => {
    const results = runColorimetricInvariantSuite()
    assert.equal(results.length, ExpectedInvariantIds.length)
    assert.deepEqual(
      results.map((r) => r.id),
      [...ExpectedInvariantIds],
    )

    for (const item of results) {
      assert.equal(item.passed, true, `${item.id}: ${item.measuredValue}`)
      assert.ok(item.samplesChecked > 0)
      assert.ok(item.name.length > 0)
      assert.ok(item.formula.length > 0)
      assert.ok(item.measuredValue.length > 0)
      assert.ok(item.threshold.length > 0)
      assert.ok(item.details.length > 0)
    }
  })
})
