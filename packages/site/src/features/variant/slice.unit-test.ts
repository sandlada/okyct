import test from 'node:test'
import assert from 'node:assert/strict'
import {
  loadVariantPreset,
  resetAllRoleOffsets,
  setCustomVariantEnabled,
  updateRoleOffset,
  variantReducer,
} from './slice.ts'

test('variantSlice handles preset loading, role offset clamping, and studio toggle', () => {
  let state = variantReducer(undefined, { type: '@@INIT' })
  assert.equal(state.enabled, false)
  assert.equal(state.basePreset, 'tonalSpot')
  assert.equal(state.roles.secondary.hueOffset, 15)

  state = variantReducer(state, updateRoleOffset({ role: 'secondary', patch: { hueOffset: 240 } }))
  assert.equal(state.enabled, true)
  assert.equal(state.roles.secondary.hueOffset, 180)

  state = variantReducer(state, loadVariantPreset({ variant: 'expressive' }))
  assert.equal(state.basePreset, 'expressive')
  assert.equal(state.roles.secondary.hueOffset, 90)
  assert.equal(state.roles.tertiary.hueOffset, 180)

  state = variantReducer(state, updateRoleOffset({ role: 'tertiary', patch: { hueOffset: -45 } }))
  assert.equal(state.roles.tertiary.hueOffset, -45)

  state = variantReducer(state, resetAllRoleOffsets())
  assert.equal(state.roles.tertiary.hueOffset, 180)

  state = variantReducer(state, setCustomVariantEnabled(false))
  assert.equal(state.enabled, false)
})
