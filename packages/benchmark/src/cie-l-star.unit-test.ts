import test from 'node:test'
import assert from 'node:assert/strict'
import { cieLStarToY, yToCieLStar } from './cie-l-star.ts'

test('cieLStarToY and yToCieLStar invert each other across [0, 100]', () => {
  for (const lStar of [0, 8, 25, 50, 75, 100]) {
    assert.ok(Math.abs(yToCieLStar(cieLStarToY(lStar)) - lStar) < 1e-6)
  }
})
