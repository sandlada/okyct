import test from 'node:test'
import assert from 'node:assert/strict'
import type { OKLCH } from './oklch.model.ts'

test('OKLCH model holds L, C, h coordinates', () => {
  const lch: OKLCH = { L: 0.65, C: 0.18, h: 250 }
  assert.equal(lch.L, 0.65)
  assert.equal(lch.C, 0.18)
  assert.equal(lch.h, 250)
})
