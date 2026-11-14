import test from 'node:test'
import assert from 'node:assert/strict'
import { ScrollSpeeds, oledReducer, setOledRunning, toggleOledRunning } from './slice.ts'

test('oledReducer toggles running state and defines ScrollSpeeds', () => {
  assert.ok(ScrollSpeeds.length > 0)
  const s0 = oledReducer(undefined, { type: '@@INIT' })
  const s1 = oledReducer(s0, setOledRunning(false))
  assert.equal(s1.running, false)
  const s2 = oledReducer(s1, toggleOledRunning())
  assert.equal(s2.running, true)
})
