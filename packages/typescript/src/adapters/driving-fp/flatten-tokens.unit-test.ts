import test from 'node:test'
import assert from 'node:assert/strict'
import { flattenTokens } from './flatten-tokens.ts'

test('flattenTokens flattens nested token objects with delimiter', () => {
  const out = flattenTokens('-')({
    color: { primary: '#2563EB', onPrimary: '#FFFFFF' },
  })
  assert.deepEqual(out, {
    'color-primary': '#2563EB',
    'color-onPrimary': '#FFFFFF',
  })
})
