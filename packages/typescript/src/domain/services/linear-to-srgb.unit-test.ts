import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearToSrgb } from './linear-to-srgb.ts'
import { srgbToLinear } from './srgb-to-linear.ts'

describe('linearToSrgb', () => {
  it('maps boundary values 0 and 1 accurately', () => {
    assert.equal(linearToSrgb(0), 0)
    assert.ok(Math.abs(linearToSrgb(1) - 1) < 1e-12)
  })

  it('evaluates linear segment (<= 0.0031308) and gamma segment continuously', () => {
    const threshold = 0.0031308
    assert.ok(Math.abs(linearToSrgb(0.002) - 12.92 * 0.002) < 1e-12)
    assert.ok(Math.abs(linearToSrgb(threshold) - 12.92 * threshold) < 1e-12)
    assert.ok(Math.abs(linearToSrgb(threshold + 1e-9) - linearToSrgb(threshold)) < 1e-6)
  })

  it('handles negative linear inputs via the linear branch without NaN', () => {
    const neg = linearToSrgb(-0.01)
    assert.equal(neg, -0.1292)
    assert.ok(Number.isFinite(neg))
  })

  it('inverts srgbToLinear across 25 points in [0, 1]', () => {
    for (let i = 0; i <= 24; i++) {
      const v = i / 24
      const restored = linearToSrgb(srgbToLinear(v))
      assert.ok(Math.abs(restored - v) < 1e-6, `failed at v=${v}`)
    }
  })

  it('throws descriptive errors for non-finite inputs', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.throws(() => linearToSrgb(bad), /Invalid linear RGB channel value/)
    }
  })
})
