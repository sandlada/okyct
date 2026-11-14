import test from 'node:test'
import assert from 'node:assert/strict'
import { isLandingPath } from './routes.ts'

test('isLandingPath returns true only for empty segments', () => {
  assert.equal(isLandingPath([]), true)
  assert.equal(isLandingPath(['studio']), false)
})
