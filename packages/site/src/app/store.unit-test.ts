import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from './store.ts'

test('createAppStore creates Redux store with all feature slices', () => {
  const store = createAppStore()
  const state = store.getState()
  assert.ok(state.theme)
  assert.ok(state.studio)
  assert.ok(state.tokens)
  assert.ok(state.benchmark)
  assert.ok(state.composition)
  assert.ok(state.delta)
  assert.ok(state.export)
  assert.ok(state.landing)
  assert.ok(state.oled)
})
