import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { xyzToCielab } from './xyz-to-cielab.ts'

describe('xyzToCielab', () => {
  it('maps black to L=0 and D65 white to L=100, a=0, b=0', () => {
    const black = xyzToCielab({ x: 0, y: 0, z: 0 })
    assert.equal(black.l, 0)
    assert.equal(black.a, 0)
    assert.equal(black.b, 0)

    const white = xyzToCielab({ x: 0.95047, y: 1.0, z: 1.08883 })
    assert.ok(Math.abs(white.l - 100) < 1e-4)
    assert.ok(Math.abs(white.a) < 1e-4)
    assert.ok(Math.abs(white.b) < 1e-4)
  })

  it('exercises the sub-epsilon linear branch cleanly for dark colors', () => {
    const dark = xyzToCielab({ x: 0.002, y: 0.002, z: 0.002 })
    assert.ok(dark.l > 0 && dark.l < 8)
    assert.ok(Number.isFinite(dark.a) && Number.isFinite(dark.b))
  })
})
