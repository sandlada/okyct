import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'

describe('linearP3ToXyz', () => {
  it('maps black to zero and white to D65 whitepoint and roundtrips with xyzToLinearP3', () => {
    assert.deepEqual(linearP3ToXyz({ r: 0, g: 0, b: 0 }), { x: 0, y: 0, z: 0 })

    const white = linearP3ToXyz({ r: 1, g: 1, b: 1 })
    assert.ok(Math.abs(white.x - 0.95047) < 1e-3)
    assert.ok(Math.abs(white.y - 1.0) < 1e-4)
    assert.ok(Math.abs(white.z - 1.08883) < 1e-3)

    const sample = { r: 0.4, g: 0.6, b: 0.2 }
    const roundtrip = xyzToLinearP3(linearP3ToXyz(sample))
    assert.ok(Math.abs(roundtrip.r - sample.r) < 1e-5)
    assert.ok(Math.abs(roundtrip.g - sample.g) < 1e-5)
    assert.ok(Math.abs(roundtrip.b - sample.b) < 1e-5)
  })
})
