import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { toTokenDictionary } from './to-token-dictionary.ts'

test('toTokenDictionary normalizes DynamicSchemeColors into a plain TokenDictionary', () => {
  const theme = createTheme('#2563EB')
  const dict = toTokenDictionary(theme.schemes.light)
  assert.equal(dict.primary, theme.schemes.light.primary)
})
