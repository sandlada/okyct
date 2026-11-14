import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { selectLandingScreen } from './selectors.ts'

describe('landing/selectors', () => {
  it('derives landing palette and benchmarkMatrix from store state', () => {
    const store = createAppStore()
    const vm = selectLandingScreen(store.getState())
    assert.ok(vm.palette.rows.length > 0)
    assert.ok(vm.benchmarkMatrix.rows.length > 0)
  })
})
