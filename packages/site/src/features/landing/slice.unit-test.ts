import test from 'node:test'
import assert from 'node:assert/strict'
import { landingReducer, setLandingSeed } from './slice.ts'

test('landingReducer updates landing seedHex', () => {
  const s0 = landingReducer(undefined, { type: '@@INIT' })
  const s1 = landingReducer(s0, setLandingSeed('#10B981'))
  assert.equal(s1.seedHex, '#10B981')
})
