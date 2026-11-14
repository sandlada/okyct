import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { selectExportCode } from './selectors.ts'

test('selectExportCode renders exportable code string from store state', () => {
  const store = createAppStore()
  const code = selectExportCode(store.getState())
  assert.ok(typeof code === 'string' && code.length > 50)
})
