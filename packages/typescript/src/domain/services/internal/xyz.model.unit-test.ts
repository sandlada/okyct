import test from 'node:test'
import assert from 'node:assert/strict'
import type { XYZ } from './xyz.model.ts'

test('XYZ model holds x, y, z tristimulus values', () => {
  const d65: XYZ = { x: 0.95047, y: 1.0, z: 1.08883 }
  assert.equal(d65.y, 1.0)
})
