import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToRgb } from './hex-to-rgb.ts'

test('hexToRgb parses 6-digit and 3-digit hex to normalized [0, 1] RGB and throws on invalid input', () => {
  const blue = hexToRgb('#2563EB')
  assert.ok(Math.abs(blue.r - 37 / 255) < 1e-6)
  assert.ok(Math.abs(blue.g - 99 / 255) < 1e-6)
  assert.ok(Math.abs(blue.b - 235 / 255) < 1e-6)
  assert.deepEqual(hexToRgb('#fff'), { r: 1, g: 1, b: 1 })
  assert.throws(() => hexToRgb('not-a-hex'), /Invalid hex/)
})
