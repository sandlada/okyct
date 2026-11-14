import test from 'node:test'
import assert from 'node:assert/strict'
import { NamingCases, type TokenDictionary } from './token-dictionary.ts'

test('NamingCases and TokenDictionary define FP token contracts', () => {
  assert.deepEqual(NamingCases, ['kebab', 'camel', 'snake', 'constant'])
  const dict: TokenDictionary = { primary: '#2563EB' }
  assert.equal(dict.primary, '#2563EB')
})
