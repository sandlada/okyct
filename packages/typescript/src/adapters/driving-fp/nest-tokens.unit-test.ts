import test from 'node:test'
import assert from 'node:assert/strict'
import { nestTokens } from './nest-tokens.ts'

test('nestTokens expands flat delimited keys into nested object', () => {
  const out = nestTokens('-')({
    'color-primary': '#2563EB',
    'color-surface': '#FFFFFF',
  })
  assert.deepEqual(out, {
    color: { primary: '#2563EB', surface: '#FFFFFF' },
  })
})
