import test from 'node:test'
import assert from 'node:assert/strict'
import { getContrastRatio } from './get-contrast-ratio.ts'
import { solveTonesForContrast } from './solve-tones-for-contrast.ts'

test('solveTonesForContrast solves exact WCAG 2.1 threshold tones in O(1)', () => {
  const sol = solveTonesForContrast(90, 4.5)
  assert.ok(sol.darkForegroundTone !== null)
  assert.ok(getContrastRatio(sol.darkForegroundTone, 90) >= 4.49)
  assert.equal(sol.lightForegroundTone, null)

  const darkSol = solveTonesForContrast(10, 7.0)
  assert.ok(darkSol.lightForegroundTone !== null)
  assert.ok(getContrastRatio(darkSol.lightForegroundTone, 10) >= 6.99)
})
