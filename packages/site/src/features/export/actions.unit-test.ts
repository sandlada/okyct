import test from 'node:test'
import assert from 'node:assert/strict'
import { copyExportCode } from './actions.ts'

test('export/actions exports copyExportCode thunk', () => {
  assert.equal(typeof copyExportCode, 'function')
})
