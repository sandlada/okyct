import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DefaultStudioView,
  StudioLegacyRedirects,
  StudioViewIds,
  StudioViews,
  isStudioLegacyId,
} from './routes.ts'

test('studio/routes defines StudioViewIds, StudioViews, DefaultStudioView, and legacy redirects', () => {
  assert.equal(DefaultStudioView, StudioViewIds.Tokens)
  assert.ok(StudioViews.length > 0)
  assert.equal(isStudioLegacyId('sandbox'), true)
  assert.equal(StudioLegacyRedirects.sandbox, 'tokens')
})
