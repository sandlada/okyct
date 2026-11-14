import test from 'node:test'
import assert from 'node:assert/strict'
import { oklabToOklch } from './oklab-to-oklch.ts'

test('oklabToOklch converts Cartesian (L, a, b) to polar (L, C, h)', () => {
  const lch = oklabToOklch({ L: 0.6, a: 0, b: 0.1 })
  assert.equal(lch.L, 0.6)
  assert.ok(Math.abs(lch.C - 0.1) < 1e-6)
  assert.ok(Math.abs(lch.h - 90) < 1e-6)
})
