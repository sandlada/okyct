import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct, okyctToHex, toneToY, yToTone } from './math.ts'

test('color/math facade re-exports domain colorimetric functions', () => {
  assert.ok(Math.abs(yToTone(toneToY(50)) - 50) < 1e-6)
  assert.equal(okyctToHex(hexToOkyct('#2563eb')), '#2563eb')
})
