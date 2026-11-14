import test from 'node:test'
import assert from 'node:assert/strict'
import { linearToSrgb } from './linear-to-srgb.ts'
import { srgbToLinear } from './srgb-to-linear.ts'

test('linearToSrgb inverts srgbToLinear across the full [0, 1] range', () => {
  for (const v of [0, 0.001, 0.04, 0.2, 0.5, 0.85, 1]) {
    const encoded = linearToSrgb(srgbToLinear(v))
    assert.ok(Math.abs(encoded - v) < 1e-6)
  }
})
