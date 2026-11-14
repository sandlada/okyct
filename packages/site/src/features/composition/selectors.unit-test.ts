import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { selectFpScreen } from './selectors.ts'

describe('composition/selectors', () => {
  it('derives stack previews and generatedTsCode from store state', () => {
    const store = createAppStore()
    const vm = selectFpScreen(store.getState())
    assert.ok(Array.isArray(vm.statePreviews))
    assert.ok(vm.statePreviews.length > 0)
    assert.equal(typeof vm.generatedTsCode, 'string')
  })
})
