import test from 'node:test'
import assert from 'node:assert/strict'
import type { GamutCusp } from './gamut-cusp.model.ts'

test('GamutCusp stores tone and chroma coordinates', () => {
  const cusp: GamutCusp = { tone: 53.24, chroma: 0.31 }
  assert.equal(cusp.tone, 53.24)
  assert.equal(cusp.chroma, 0.31)
})
