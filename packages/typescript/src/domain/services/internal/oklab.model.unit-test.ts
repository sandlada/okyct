import test from 'node:test'
import assert from 'node:assert/strict'
import type { OKLab } from './oklab.model.ts'

test('OKLab model holds L, a, b coordinates', () => {
  const lab: OKLab = { L: 0.7, a: -0.04, b: 0.12 }
  assert.equal(lab.L, 0.7)
  assert.equal(lab.a, -0.04)
  assert.equal(lab.b, 0.12)
})
