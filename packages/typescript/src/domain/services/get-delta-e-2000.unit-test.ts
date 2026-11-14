import test from 'node:test'
import assert from 'node:assert/strict'
import { getDeltaE2000 } from './get-delta-e-2000.ts'

test('getDeltaE2000 returns 0 for identical colors and positive for different colors', () => {
  assert.equal(getDeltaE2000('#2563EB', '#2563EB'), 0)
  assert.ok(getDeltaE2000('#000000', '#FFFFFF') > 90)
  assert.ok(getDeltaE2000('#2563EB', '#2563EC') < 1)
})
