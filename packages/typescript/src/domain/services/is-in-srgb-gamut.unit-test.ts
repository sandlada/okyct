import test from 'node:test'
import assert from 'node:assert/strict'
import { isInSrgbGamut } from './is-in-srgb-gamut.ts'

test('isInSrgbGamut supports both OKYCT object and (h, c, t) arguments', () => {
  assert.equal(isInSrgbGamut({ h: 0, c: 0, t: 50 }).inGamut, true)
  assert.equal(isInSrgbGamut(0, 0, 50).inGamut, true)
  assert.equal(isInSrgbGamut(145, 0.45, 60).inGamut, false)
})
