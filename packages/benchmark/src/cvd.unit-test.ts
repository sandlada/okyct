import test from 'node:test'
import assert from 'node:assert/strict'
import { simulateCvd } from './cvd.ts'

test('cvd.ts re-exports simulateCvd from @sandlada/okyct', () => {
  assert.equal(simulateCvd('#2563EB', 'none').toLowerCase(), '#2563eb')
  assert.match(simulateCvd('#EF4444', 'protanopia'), /^#[0-9a-f]{6}$/i)
})
