import test from 'node:test'
import assert from 'node:assert/strict'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'

test('linearRgbToXyz roundtrips with xyzToLinearRgb', () => {
  const sample = { r: 0.2, g: 0.5, b: 0.8 }
  const roundtrip = xyzToLinearRgb(linearRgbToXyz(sample))
  assert.ok(Math.abs(roundtrip.r - sample.r) < 1e-5)
  assert.ok(Math.abs(roundtrip.g - sample.g) < 1e-5)
  assert.ok(Math.abs(roundtrip.b - sample.b) < 1e-5)
})
