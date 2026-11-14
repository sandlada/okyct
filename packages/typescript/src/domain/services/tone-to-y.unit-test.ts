import test from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from './tone-to-y.ts'

test('toneToY maps [0, 100] monotonically to [0, 1] with piecewise continuity at Tone 8', () => {
  assert.equal(toneToY(0), 0)
  assert.ok(Math.abs(toneToY(100) - 1) < 1e-6)
  assert.ok(toneToY(50) > toneToY(8))
  assert.ok(Math.abs(toneToY(8) - 8 / 903.3) < 1e-4)
})
