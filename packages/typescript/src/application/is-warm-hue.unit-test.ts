import test from 'node:test'
import assert from 'node:assert/strict'
import { isWarmHue } from './is-warm-hue.ts'

test('isWarmHue classifies warm hues vs cool hues', () => {
  assert.equal(isWarmHue(30), true)
  assert.equal(isWarmHue(350), true)
  assert.equal(isWarmHue(240), false)
})
