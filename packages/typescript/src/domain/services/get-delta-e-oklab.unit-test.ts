import test from 'node:test'
import assert from 'node:assert/strict'
import { getDeltaEOklab } from './get-delta-e-oklab.ts'

test('getDeltaEOklab returns 0 for identical hex and >0 for distinct colors', () => {
  assert.equal(getDeltaEOklab('#10B981', '#10B981'), 0)
  assert.ok(getDeltaEOklab('#000000', '#FFFFFF') > 0.9)
})
