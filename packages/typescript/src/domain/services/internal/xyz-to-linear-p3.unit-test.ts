import test from 'node:test'
import assert from 'node:assert/strict'
import { linearP3ToXyz } from './linear-p3-to-xyz.ts'
import { xyzToLinearP3 } from './xyz-to-linear-p3.ts'

test('xyzToLinearP3 maps D65 white to (1, 1, 1) and inverts linearP3ToXyz', () => {
  const white = xyzToLinearP3({ x: 0.95047, y: 1.0, z: 1.08883 })
  assert.ok(Math.abs(white.r - 1) < 1e-2)
  assert.ok(Math.abs(white.g - 1) < 1e-2)
  assert.ok(Math.abs(white.b - 1) < 1e-2)

  const back = xyzToLinearP3(linearP3ToXyz({ r: 0.3, g: 0.5, b: 0.7 }))
  assert.ok(Math.abs(back.r - 0.3) < 1e-5)
})
