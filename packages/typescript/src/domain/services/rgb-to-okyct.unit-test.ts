import test from 'node:test'
import assert from 'node:assert/strict'
import { rgbToOkyct } from './rgb-to-okyct.ts'

test('rgbToOkyct converts normalized [0, 1] RGB to valid OKYCT coordinates', () => {
  const gray = rgbToOkyct({ r: 0.5, g: 0.5, b: 0.5 })
  assert.ok(gray.c < 1e-4)
  assert.ok(gray.t > 50 && gray.t < 56)

  const red = rgbToOkyct({ r: 1, g: 0, b: 0 })
  assert.ok(red.h >= 20 && red.h <= 40)
  assert.ok(red.c > 0.2)
})
