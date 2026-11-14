import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  compositionReducer,
  loadFpPreset,
  setFpBlendSpace,
} from './slice.ts'

describe('composition/slice', () => {
  it('updates blendSpace and loads preset', () => {
    const initial = compositionReducer(undefined, { type: '@@INIT' })
    const updated = compositionReducer(initial, setFpBlendSpace('linear-srgb'))
    assert.equal(updated.blendSpace, 'linear-srgb')
    const presetLoaded = compositionReducer(updated, loadFpPreset('nested-json'))
    assert.equal(presetLoaded.preset, 'nested-json')
    assert.ok(presetLoaded.steps.length > 0)
  })
})
