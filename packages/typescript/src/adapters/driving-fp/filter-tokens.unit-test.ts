import test from 'node:test'
import assert from 'node:assert/strict'
import { filterTokens } from './filter-tokens.ts'

test('filterTokens retains only entries matching predicate', () => {
  const out = filterTokens((key) => key.startsWith('primary'))({
    primary: '#2563EB',
    primaryContainer: '#DBEAFE',
    surface: '#FFFFFF',
  })
  assert.deepEqual(out, { primary: '#2563EB', primaryContainer: '#DBEAFE' })
})
