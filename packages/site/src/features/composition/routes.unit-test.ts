import test from 'node:test'
import assert from 'node:assert/strict'
import { CompositionLegacySlugs, CompositionStudioSlug } from './routes.ts'

test('composition/routes defines primary and legacy slugs', () => {
  assert.equal(CompositionStudioSlug, 'composition')
  assert.deepEqual(CompositionLegacySlugs, ['fp'])
})
