import test from 'node:test'
import assert from 'node:assert/strict'
import { getContrastRatio } from './get-contrast-ratio.ts'

test('getContrastRatio computes symmetric WCAG 2.1 ratio', () => {
  assert.ok(Math.abs(getContrastRatio(0, 100) - 21) < 0.01)
  assert.equal(getContrastRatio('#FFFFFF', '#FFFFFF'), 1)
  assert.equal(getContrastRatio(40, 90), getContrastRatio(90, 40))
})
