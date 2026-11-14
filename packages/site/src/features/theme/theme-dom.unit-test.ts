import test from 'node:test'
import assert from 'node:assert/strict'
import { ThemeStorageKey, readStoredTheme } from './theme-dom.ts'

test('theme-dom defines ThemeStorageKey and handles SSR/non-browser readStoredTheme safely', () => {
  assert.equal(ThemeStorageKey, 'okyct.theme')
  assert.equal(readStoredTheme(), null)
})
