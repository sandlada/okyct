import test from 'node:test'
import assert from 'node:assert/strict'
import { shortestHueDelta } from './shortest-hue-delta.ts'

test('shortestHueDelta computes shortest unsigned angular distance across 0/360 wrap', () => {
  assert.equal(shortestHueDelta(10, 350), 20)
  assert.equal(shortestHueDelta(350, 10), 20)
  assert.equal(shortestHueDelta(90, 90), 0)
  assert.equal(shortestHueDelta(0, 180), 180)
})
