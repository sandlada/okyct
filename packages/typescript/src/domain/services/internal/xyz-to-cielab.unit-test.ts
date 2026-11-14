import test from 'node:test'
import assert from 'node:assert/strict'
import { xyzToCielab } from './xyz-to-cielab.ts'

test('xyzToCielab maps D65 white to l=100, a=0, b=0 and black to l=0', () => {
  const black = xyzToCielab({ x: 0, y: 0, z: 0 })
  assert.equal(black.l, 0)

  const white = xyzToCielab({ x: 0.95047, y: 1.0, z: 1.08883 })
  assert.ok(Math.abs(white.l - 100) < 1e-4)
  assert.ok(Math.abs(white.a) < 1e-4)
  assert.ok(Math.abs(white.b) < 1e-4)
})
