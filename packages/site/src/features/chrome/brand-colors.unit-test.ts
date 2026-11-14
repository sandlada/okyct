import test from 'node:test'
import assert from 'node:assert/strict'
import { DefaultBrandColors } from './brand-colors.ts'

test('DefaultBrandColors provides 3 valid hex brand seeds', () => {
  assert.equal(DefaultBrandColors.length, 3)
  for (const hex of DefaultBrandColors) {
    assert.match(hex, /^#[0-9a-f]{6}$/i)
  }
})
