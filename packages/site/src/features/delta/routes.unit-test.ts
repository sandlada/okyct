import test from 'node:test'
import assert from 'node:assert/strict'
import { DeltaStudioSlug } from './routes.ts'

test('delta/routes defines DeltaStudioSlug', () => {
  assert.equal(DeltaStudioSlug, 'delta')
})
