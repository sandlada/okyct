import test from 'node:test'
import assert from 'node:assert/strict'
import type { RGB } from './rgb.model.ts'

test('RGB holds r, g, b channel values', () => {
  const white: RGB = { r: 255, g: 255, b: 255 }
  assert.equal(white.r + white.g + white.b, 765)
})
