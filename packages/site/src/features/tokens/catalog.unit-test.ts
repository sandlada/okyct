import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SystemTokenDefinitions,
  TokenCategories,
  TokensWithoutAaPreview,
} from './catalog.ts'

describe('tokens/catalog', () => {
  it('defines non-empty TokenCategories and SystemTokenDefinitions', () => {
    assert.ok(Array.isArray(TokenCategories))
    assert.ok(TokenCategories.length > 0)
    assert.ok(Array.isArray(SystemTokenDefinitions))
    assert.ok(SystemTokenDefinitions.length > 0)
    assert.ok(TokensWithoutAaPreview instanceof Set)
  })
})
