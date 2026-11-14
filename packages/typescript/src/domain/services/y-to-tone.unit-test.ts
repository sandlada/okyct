import test from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'

test('yToTone inverts toneToY bijectively across [0, 100]', () => {
  for (const t of [0, 4, 8, 20, 40, 50, 75, 92, 100]) {
    assert.ok(Math.abs(yToTone(toneToY(t)) - t) < 1e-6)
  }
})
