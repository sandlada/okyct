import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import {
  selectReferenceHexState,
  selectScaleAContrastRows,
  selectScaleACoreAnalysis,
  selectScaleBCoreAnalysis,
  selectScalePairComparison,
} from './selectors.ts'

test('delta/selectors compute scale core analysis, contrast rows, and pair comparison', () => {
  const store = createAppStore()
  const state = store.getState()
  assert.ok(selectReferenceHexState(state))
  assert.ok(selectScaleACoreAnalysis(state).steps.length > 0)
  assert.ok(selectScaleBCoreAnalysis(state).steps.length > 0)
  assert.ok(selectScaleAContrastRows(state).length > 0)
  assert.ok(Array.isArray(selectScalePairComparison(state)))
})
