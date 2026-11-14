import test from 'node:test'
import assert from 'node:assert/strict'
import { mean, percentile95, weightedHueTriplet } from './metrics.ts'

test('metrics helpers compute mean, p95, and weightedHueTriplet', () => {
  assert.equal(mean([10, 20, 30]), 20)
  assert.equal(percentile95([1, 2, 3, 4, 5]), 5)
  const triplet = weightedHueTriplet('#2563EB', 290, 263, 275)
  assert.ok(triplet.cielab >= 0)
  assert.ok(triplet.oklab >= 0)
  assert.ok(triplet.hct >= 0)
})
