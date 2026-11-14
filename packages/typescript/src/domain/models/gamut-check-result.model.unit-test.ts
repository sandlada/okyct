import test from 'node:test'
import assert from 'node:assert/strict'
import type { GamutCheckResult } from './gamut-check-result.model.ts'

test('GamutCheckResult holds inGamut flag and clamped/raw RGB', () => {
  const result: GamutCheckResult = {
    inGamut: true,
    rgb: { r: 10, g: 20, b: 30 },
  }
  assert.equal(result.inGamut, true)
  assert.deepEqual(result.rgb, { r: 10, g: 20, b: 30 })
})
