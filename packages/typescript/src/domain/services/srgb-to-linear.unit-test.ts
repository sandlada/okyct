import test from 'node:test'
import assert from 'node:assert/strict'
import { srgbToLinear } from './srgb-to-linear.ts'

test('srgbToLinear handles piecewise linear and gamma segments accurately', () => {
  assert.equal(srgbToLinear(0), 0)
  assert.equal(srgbToLinear(1), 1)
  assert.ok(srgbToLinear(0.5) > 0.21 && srgbToLinear(0.5) < 0.22)
  assert.ok(srgbToLinear(0.02) < 0.002)
})
