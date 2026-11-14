import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DeltaPaletteKeys,
  DeltaScaleSourceKinds,
  DeltaSectionIds,
  deltaReducer,
} from './slice.ts'

test('delta/slice defines constants and initializes reducer state', () => {
  assert.ok(DeltaPaletteKeys.includes('primary'))
  assert.ok(DeltaScaleSourceKinds.length > 0)
  assert.ok(DeltaSectionIds.length > 0)
  const state = deltaReducer(undefined, { type: '@@INIT' })
  assert.ok(state)
})
