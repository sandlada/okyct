import test from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { solveOklabLForTargetY } from './solve-oklab-l-for-target-y.ts'

test('solveOklabLForTargetY solves OKLab L for target CIE y with high precision', () => {
  assert.equal(solveOklabLForTargetY(0, 0, 0), 0)
  assert.equal(solveOklabLForTargetY(1, 0, 0), 1)

  const targetY = 0.25
  const L = solveOklabLForTargetY(targetY, 0.04, -0.08)
  const xyz = oklabToXyz({ L, a: 0.04, b: -0.08 })
  assert.ok(Math.abs(xyz.y - targetY) < 1e-6)
})
