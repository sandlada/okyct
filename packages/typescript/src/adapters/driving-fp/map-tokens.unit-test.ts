import test from 'node:test'
import assert from 'node:assert/strict'
import { mapTokens } from './map-tokens.ts'

test('mapTokens transforms every token value while preserving keys', () => {
  const out = mapTokens((val) => val.toLowerCase())({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(out, { primary: '#2563eb', surface: '#ffffff' })
})
