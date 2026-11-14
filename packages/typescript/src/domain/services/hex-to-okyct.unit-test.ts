import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from './hex-to-okyct.ts'

test('hexToOkyct converts black, white, and chromatic hex accurately', () => {
  const black = hexToOkyct('#000000')
  assert.equal(black.t, 0)
  assert.equal(black.c, 0)

  const white = hexToOkyct('#FFFFFF')
  assert.ok(Math.abs(white.t - 100) < 1e-4)

  const blue = hexToOkyct('#2563EB')
  assert.ok(blue.h > 240 && blue.h < 280)
  assert.ok(blue.c > 0.15)
  assert.ok(blue.t > 35 && blue.t < 55)
})
