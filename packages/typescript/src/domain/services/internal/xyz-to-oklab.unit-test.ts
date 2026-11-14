import test from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { xyzToOklab } from './xyz-to-oklab.ts'

test('xyzToOklab maps black to L=0 and inverts oklabToXyz', () => {
  const black = xyzToOklab({ x: 0, y: 0, z: 0 })
  assert.equal(black.L, 0)

  const back = xyzToOklab(oklabToXyz({ L: 0.55, a: -0.06, b: 0.09 }))
  assert.ok(Math.abs(back.L - 0.55) < 1e-5)
  assert.ok(Math.abs(back.a - (-0.06)) < 1e-5)
})
