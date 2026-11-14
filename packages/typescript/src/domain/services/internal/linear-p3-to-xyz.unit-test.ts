import test from 'node:test'
import assert from 'node:assert/strict'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'

test('linearP3ToXyz roundtrips with xyzToLinearP3', () => {
  const sample = { r: 0.4, g: 0.6, b: 0.2 }
  const roundtrip = xyzToLinearP3(linearP3ToXyz(sample))
  assert.ok(Math.abs(roundtrip.r - sample.r) < 1e-5)
  assert.ok(Math.abs(roundtrip.g - sample.g) < 1e-5)
  assert.ok(Math.abs(roundtrip.b - sample.b) < 1e-5)
})
