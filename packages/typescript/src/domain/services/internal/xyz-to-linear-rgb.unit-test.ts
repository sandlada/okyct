import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'

describe('xyzToLinearRgb', () => {
  it('maps zero to black, D65 white to (1, 1, 1), and inverts linearRgbToXyz', () => {
    assert.deepEqual(xyzToLinearRgb({ x: 0, y: 0, z: 0 }), { r: 0, g: 0, b: 0 })

    const white = xyzToLinearRgb({ x: 0.95047, y: 1.0, z: 1.08883 })
    assert.ok(Math.abs(white.r - 1) < 1e-3)
    assert.ok(Math.abs(white.g - 1) < 1e-3)
    assert.ok(Math.abs(white.b - 1) < 1e-3)

    const sample = { r: 0.25, g: 0.5, b: 0.75 }
    const back = xyzToLinearRgb(linearRgbToXyz(sample))
    assert.ok(Math.abs(back.r - sample.r) < 1e-5)
    assert.ok(Math.abs(back.g - sample.g) < 1e-5)
    assert.ok(Math.abs(back.b - sample.b) < 1e-5)
  })
})
