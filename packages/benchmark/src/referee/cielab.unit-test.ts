import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateAngleDelta,
  cielabChroma,
  cielabHueDeg,
  hexToCielab,
  shortestHueDeltaDeg,
} from './cielab.ts'

test('referee/cielab computes L*a*b*, chroma, hue, and shortest angular delta', () => {
  const lab = hexToCielab('#2563EB')
  assert.ok(lab.L > 30 && lab.L < 60)
  assert.ok(cielabChroma(lab) > 20)
  assert.ok(cielabHueDeg(lab) >= 0 && cielabHueDeg(lab) < 360)
  assert.equal(shortestHueDeltaDeg(10, 350), 20)
  assert.equal(calculateAngleDelta(350, 10), 20)
})
