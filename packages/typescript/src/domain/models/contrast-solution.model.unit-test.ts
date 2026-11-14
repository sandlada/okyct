import test from 'node:test'
import assert from 'node:assert/strict'
import type { ContrastSolution } from './contrast-solution.model.ts'

test('ContrastSolution supports nullable dark and light foreground tones', () => {
  const solution: ContrastSolution = {
    darkForegroundTone: 12,
    lightForegroundTone: null,
  }
  assert.equal(solution.darkForegroundTone, 12)
  assert.equal(solution.lightForegroundTone, null)
})
