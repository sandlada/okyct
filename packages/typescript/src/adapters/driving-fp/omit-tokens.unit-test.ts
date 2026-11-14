import test from 'node:test'
import assert from 'node:assert/strict'
import { omitTokens } from './omit-tokens.ts'

test('omitTokens excludes specified keys from token dictionary', () => {
  const out = omitTokens(['surface'])({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(out, { primary: '#2563EB' })
})
