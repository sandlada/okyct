import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { addFpLayer } from './actions.ts'

test('addFpLayer dispatches layer addition into composition slice', () => {
  const store = createAppStore()
  const before = store.getState().composition.layers.length
  store.dispatch(addFpLayer('Hover'))
  assert.equal(store.getState().composition.layers.length, before + 1)
})
