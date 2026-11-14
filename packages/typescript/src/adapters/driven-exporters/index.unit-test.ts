import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TokenExportFormats,
  exportCssVariables,
  exportTailwindV4,
  exportTheme,
  exportTypeScriptTokens,
  exportW3cDesignTokens,
} from './index.ts'

test('driven-exporters barrel exports all theme formatters', () => {
  assert.deepEqual(TokenExportFormats, ['css', 'tailwind', 'w3c', 'ts'])
  assert.equal(typeof exportCssVariables, 'function')
  assert.equal(typeof exportTailwindV4, 'function')
  assert.equal(typeof exportW3cDesignTokens, 'function')
  assert.equal(typeof exportTypeScriptTokens, 'function')
  assert.equal(typeof exportTheme, 'function')
})
