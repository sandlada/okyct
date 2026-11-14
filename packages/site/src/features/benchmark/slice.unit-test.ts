import test from 'node:test'
import assert from 'node:assert/strict'
import { YellowDemo, benchmarkReducer, setYellowMode, toggleYellowMode } from './slice.ts'

test('benchmarkReducer toggles and sets yellowMode', () => {
  assert.ok(YellowDemo)
  const s0 = benchmarkReducer(undefined, { type: '@@INIT' })
  const s1 = benchmarkReducer(s0, setYellowMode('naive'))
  assert.equal(s1.yellowMode, 'naive')
  const s2 = benchmarkReducer(s1, toggleYellowMode())
  assert.equal(s2.yellowMode, 'okyct')
})
