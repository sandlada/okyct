import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { srgbToLinear } from './srgb-to-linear.ts'

describe('srgbToLinear', () => {
  it('maps boundary values 0 and 1 accurately', () => {
    assert.equal(srgbToLinear(0), 0)
    assert.equal(srgbToLinear(1), 1)
  })

  it('evaluates linear segment (<= 0.04045) and gamma 2.4 segment (> 0.04045) continuously', () => {
    const threshold = 0.04045
    assert.ok(Math.abs(srgbToLinear(0.02) - 0.02 / 12.92) < 1e-12)
    assert.ok(Math.abs(srgbToLinear(threshold) - threshold / 12.92) < 1e-12)

    const justAbove = srgbToLinear(threshold + 1e-9)
    assert.ok(Math.abs(justAbove - srgbToLinear(threshold)) < 1e-7)

    const mid = srgbToLinear(0.5)
    assert.ok(Math.abs(mid - Math.pow(0.555 / 1.055, 2.4)) < 1e-12)
  })

  it('is strictly monotonically increasing across [0, 1]', () => {
    let prev = -1
    for (let i = 0; i <= 100; i++) {
      const val = srgbToLinear(i / 100)
      assert.ok(val > prev)
      prev = val
    }
  })

  it('throws descriptive errors for non-finite inputs', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.throws(() => srgbToLinear(bad), /Invalid sRGB channel value/)
    }
  })
})
