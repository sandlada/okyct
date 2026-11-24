import test from 'node:test'
import assert from 'node:assert/strict'
import { VariantStudioSlug } from './routes.ts'

test('variant/routes exports VariantStudioSlug', () => {
  assert.equal(VariantStudioSlug, 'variant')
})
