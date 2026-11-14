import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportW3cDesignTokens } from './export-w3c-design-tokens.ts'

test('exportW3cDesignTokens emits valid JSON adhering to W3C DTCG structure', () => {
  const theme = createTheme('#2563EB')
  const json = exportW3cDesignTokens(theme.schemes.light, theme.schemes.dark)
  const parsed = JSON.parse(json) as { color: { light: unknown; dark: unknown } }
  assert.ok(parsed.color.light)
  assert.ok(parsed.color.dark)
})
