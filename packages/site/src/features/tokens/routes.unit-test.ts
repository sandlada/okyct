import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TokensLegacySlugs, TokensStudioSlug } from './routes.ts'

describe('tokens/routes', () => {
  it('exports TokensStudioSlug and TokensLegacySlugs', () => {
    assert.equal(TokensStudioSlug, 'tokens')
    assert.ok(Array.isArray(TokensLegacySlugs))
    assert.ok(TokensLegacySlugs.includes('sandbox'))
  })
})
