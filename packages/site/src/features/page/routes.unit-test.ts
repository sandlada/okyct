import test from 'node:test'
import assert from 'node:assert/strict'
import { PageStudioSlug } from './routes.ts'

test('page/routes defines PageStudioSlug', () => {
  assert.equal(PageStudioSlug, 'page')
})
