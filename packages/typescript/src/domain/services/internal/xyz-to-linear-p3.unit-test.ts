import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'

describe('xyzToLinearP3', () => {
  it('maps zero to black, D65 white to (1, 1, 1), and inverts linearP3ToXyz', () => {
    assert.deepEqual(xyzToLinearP3({ x: 0, y: 0, z: 0 }), { r: 0, g: 0, b: 0 })

    const white = xyzToLinearP3({ x: 0.95047, y: 1.0, z: 1.08883 })
    assert.ok(Math.abs(white.r - 1) < 1e-2)
    assert.ok(Math.abs(white.g - 1) < 1e-2)
    assert.ok(Math.abs(white.b - 1) < 1e-2)

    const sample = { r: 0.3, g: 0.5, b: 0.7 }
    const back = xyzToLinearP3(linearP3ToXyz(sample))
    assert.ok(Math.abs(back.r - sample.r) < 1e-5)
    assert.ok(Math.abs(back.g - sample.g) < 1e-5)
    assert.ok(Math.abs(back.b - sample.b) < 1e-5)
  })
})
