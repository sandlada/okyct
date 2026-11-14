import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'

describe('linearRgbToXyz', () => {
  it('maps black to zero and white to D65 whitepoint and roundtrips with xyzToLinearRgb', () => {
    assert.deepEqual(linearRgbToXyz({ r: 0, g: 0, b: 0 }), { x: 0, y: 0, z: 0 })

    const white = linearRgbToXyz({ r: 1, g: 1, b: 1 })
    assert.ok(Math.abs(white.x - 0.95047) < 1e-4)
    assert.ok(Math.abs(white.y - 1.0) < 1e-4)
    assert.ok(Math.abs(white.z - 1.08883) < 1e-3)

    const sample = { r: 0.2, g: 0.5, b: 0.8 }
    const roundtrip = xyzToLinearRgb(linearRgbToXyz(sample))
    assert.ok(Math.abs(roundtrip.r - sample.r) < 1e-5)
    assert.ok(Math.abs(roundtrip.g - sample.g) < 1e-5)
    assert.ok(Math.abs(roundtrip.b - sample.b) < 1e-5)
  })
})
