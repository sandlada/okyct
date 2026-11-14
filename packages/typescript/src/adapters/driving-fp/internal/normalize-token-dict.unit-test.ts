import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTokenDict } from './normalize-token-dict.ts'

test('normalizeTokenDict returns a shallow string dictionary from TokenSource', () => {
  const dict = normalizeTokenDict({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(dict, { primary: '#2563EB', surface: '#FFFFFF' })
})
