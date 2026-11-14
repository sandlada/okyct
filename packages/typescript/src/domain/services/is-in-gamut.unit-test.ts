import test from 'node:test'
import assert from 'node:assert/strict'
import { isInGamut } from './is-in-gamut.ts'

test('isInGamut detects in-gamut and out-of-gamut colors for srgb and display-p3', () => {
  assert.equal(isInGamut({ h: 250, c: 0.05, t: 50 }, 'srgb').inGamut, true)
  assert.equal(isInGamut({ h: 145, c: 0.45, t: 60 }, 'srgb').inGamut, false)
  assert.equal(isInGamut({ h: 145, c: 0.15, t: 60 }, 'display-p3').inGamut, true)
})
