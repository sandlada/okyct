import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

describe('xyzToOklab', () => {
  it('maps black and D65 white accurately and inverts oklabToXyz', () => {
    const black = xyzToOklab({ x: 0, y: 0, z: 0 })
    assert.equal(black.L, 0)
    assert.equal(black.a, 0)
    assert.equal(black.b, 0)

    const white = xyzToOklab({ x: 0.95047, y: 1.0, z: 1.08883 })
    assert.ok(Math.abs(white.L - 1) < 1e-2)
    assert.ok(Math.abs(white.a) < 1e-3)
    assert.ok(Math.abs(white.b) < 1e-3)

    const sample = { L: 0.55, a: -0.06, b: 0.09 }
    const back = xyzToOklab(oklabToXyz(sample))
    assert.ok(Math.abs(back.L - sample.L) < 1e-5)
    assert.ok(Math.abs(back.a - sample.a) < 1e-5)
    assert.ok(Math.abs(back.b - sample.b) < 1e-5)
  })
})
