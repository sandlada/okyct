import test from 'node:test'
import assert from 'node:assert/strict'
import { rgbToHex } from './rgb-to-hex.ts'

test('rgbToHex formats lowercase 6-digit hex from normalized [0, 1] RGB and clamps out-of-range', () => {
  assert.equal(rgbToHex({ r: 37 / 255, g: 99 / 255, b: 235 / 255 }), '#2563eb')
  assert.equal(rgbToHex({ r: -0.2, g: 1.5, b: 0 }), '#00ff00')
})
