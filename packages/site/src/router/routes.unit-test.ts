import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DefaultStudioView,
  isStudioView,
  landingPath,
  matchRoute,
  pathForLocale,
  studioPath,
} from './routes.ts'

test('router/routes matches landing, studio, and not-found routes and builds localized paths', () => {
  assert.equal(isStudioView(DefaultStudioView), true)
  assert.equal(matchRoute(landingPath('en')).kind, 'landing')
  const studio = matchRoute(studioPath('zh-Hant', 'tokens'))
  assert.equal(studio.kind, 'studio')
  assert.equal(matchRoute('/nonexistent-route-xyz').kind, 'not-found')
  assert.ok(pathForLocale(landingPath('en'), 'zh-Hant').includes('zh'))
})
