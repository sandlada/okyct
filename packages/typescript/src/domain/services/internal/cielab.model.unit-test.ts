import test from 'node:test'
import assert from 'node:assert/strict'
import type { CIELAB } from './cielab.model.ts'

test('CIELAB model holds l, a, b coordinates', () => {
  const lab: CIELAB = { l: 50, a: 20, b: -30 }
  assert.equal(lab.l, 50)
  assert.equal(lab.a, 20)
  assert.equal(lab.b, -30)
})
