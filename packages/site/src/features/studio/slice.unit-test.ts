import test from 'node:test'
import assert from 'node:assert/strict'
import { setSourceHex, studioReducer } from './slice.ts'

test('studioReducer initializes state and updates sourceHex', () => {
  const s0 = studioReducer(undefined, { type: '@@INIT' })
  const s1 = studioReducer(s0, setSourceHex('#10B981'))
  assert.equal(s1.sourceHex, '#10B981')
})
