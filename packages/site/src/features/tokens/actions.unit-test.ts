import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { copyTokenText } from './actions.ts'

describe('tokens/actions', () => {
  it('exports copyTokenText thunk creator', () => {
    assert.equal(typeof copyTokenText, 'function')
    const thunk = copyTokenText('#000000', 'Copied!')
    assert.equal(typeof thunk, 'function')
  })
})
