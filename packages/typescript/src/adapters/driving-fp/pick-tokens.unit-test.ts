import test from 'node:test'
import assert from 'node:assert/strict'
import { pickTokens } from './pick-tokens.ts'

test('pickTokens retains only the specified keys', () => {
  const out = pickTokens(['primary'])({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(out, { primary: '#2563EB' })
})
