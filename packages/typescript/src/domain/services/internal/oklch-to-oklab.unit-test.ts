import test from 'node:test'
import assert from 'node:assert/strict'
import { oklchToOklab } from './oklch-to-oklab.ts'

test('oklchToOklab converts polar (L, C, h) to Cartesian (L, a, b)', () => {
  const lab = oklchToOklab({ L: 0.5, C: 0.2, h: 180 })
  assert.equal(lab.L, 0.5)
  assert.ok(Math.abs(lab.a - (-0.2)) < 1e-6)
  assert.ok(Math.abs(lab.b) < 1e-6)
})
