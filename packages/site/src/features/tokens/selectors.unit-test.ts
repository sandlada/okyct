import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  selectContrastAudits,
  selectCustomRoleGroups,
  selectRampFamilies,
  selectTokenCards,
} from './selectors.ts'

describe('tokens/selectors', () => {
  it('exports token selector functions', () => {
    assert.equal(typeof selectTokenCards, 'function')
    assert.equal(typeof selectCustomRoleGroups, 'function')
    assert.equal(typeof selectContrastAudits, 'function')
    assert.equal(typeof selectRampFamilies, 'function')
  })
})
