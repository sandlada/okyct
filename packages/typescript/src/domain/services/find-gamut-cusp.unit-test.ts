import test from 'node:test'
import assert from 'node:assert/strict'
import { findGamutCusp } from './find-gamut-cusp.ts'

test('findGamutCusp returns positive chroma and valid tone for srgb and display-p3', () => {
  const srgbCusp = findGamutCusp(145, 'srgb')
  const p3Cusp = findGamutCusp(145, 'display-p3')

  assert.ok(srgbCusp.tone > 0 && srgbCusp.tone < 100)
  assert.ok(srgbCusp.chroma > 0.1)
  assert.ok(p3Cusp.chroma >= srgbCusp.chroma)
})
