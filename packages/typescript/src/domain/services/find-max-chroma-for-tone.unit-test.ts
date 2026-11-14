import test from 'node:test'
import assert from 'node:assert/strict'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { isInGamut } from './is-in-gamut.ts'

test('findMaxChromaForTone finds boundary chroma within gamut', () => {
  const maxC = findMaxChromaForTone(250, 50, 'srgb')
  assert.ok(maxC > 0.05)
  assert.equal(isInGamut({ h: 250, c: maxC * 0.99, t: 50 }, 'srgb').inGamut, true)
  assert.equal(findMaxChromaForTone(250, 0, 'srgb'), 0)
  assert.equal(findMaxChromaForTone(250, 100, 'srgb'), 0)
})
