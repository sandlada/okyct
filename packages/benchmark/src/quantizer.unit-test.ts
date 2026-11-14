import test from 'node:test'
import assert from 'node:assert/strict'
import { quantizeNearest } from './quantizer.ts'

test('quantizeNearest converts normalized [0, 1] RGB to clamped 8-bit hex', () => {
  assert.equal(quantizeNearest({ r: 37 / 255, g: 99 / 255, b: 235 / 255 }).toLowerCase(), '#2563eb')
  assert.equal(quantizeNearest({ r: -0.5, g: 2.0, b: 0 }).toLowerCase(), '#00ff00')
})
