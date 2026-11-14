import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportTypeScriptTokens } from './export-typescript-tokens.ts'

test('exportTypeScriptTokens emits typed TypeScript theme constants', () => {
  const theme = createTheme('#2563EB')
  const ts = exportTypeScriptTokens(theme.schemes.light, theme.schemes.dark)
  assert.match(ts, /export const LightThemeTokens/)
  assert.match(ts, /export const DarkThemeTokens/)
})
