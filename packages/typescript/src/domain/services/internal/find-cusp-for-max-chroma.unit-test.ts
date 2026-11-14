import test from 'node:test'
import assert from 'node:assert/strict'
import { findCuspForMaxChroma } from './find-cusp-for-max-chroma.ts'

test('findCuspForMaxChroma locates peak chroma tone for srgb and display-p3', () => {
  const cusp = findCuspForMaxChroma(30, 'srgb')
  assert.ok(cusp.tone > 10 && cusp.tone < 90)
  assert.ok(cusp.chroma > 0.15)
})
