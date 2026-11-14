import test from 'node:test'
import assert from 'node:assert/strict'
import { linearRgbToXyz } from './linear-rgb-to-xyz.ts'
import { xyzToLinearRgb } from './xyz-to-linear-rgb.ts'

test('xyzToLinearRgb maps D65 white to (1, 1, 1) and inverts linearRgbToXyz', () => {
  const white = xyzToLinearRgb({ x: 0.95047, y: 1.0, z: 1.08883 })
  assert.ok(Math.abs(white.r - 1) < 1e-3)
  assert.ok(Math.abs(white.g - 1) < 1e-3)
  assert.ok(Math.abs(white.b - 1) < 1e-3)

  const back = xyzToLinearRgb(linearRgbToXyz({ r: 0.25, g: 0.5, b: 0.75 }))
  assert.ok(Math.abs(back.g - 0.5) < 1e-5)
})
