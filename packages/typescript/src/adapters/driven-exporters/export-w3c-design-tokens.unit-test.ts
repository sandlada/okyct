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

test('exportW3cDesignTokens throws on custom color collisions with system roles or duplicate custom names', () => {
  const sysCollision = createTheme({ sourceHex: '#2563EB', customColors: { primary: '#FF0000' } })
  assert.throws(() => sysCollision.export('w3c'), /Token key collision in exportW3cDesignTokens/)

  const dupCustom = createTheme({
    sourceHex: '#2563EB',
    customColors: [
      { name: 'brand', sourceHex: '#FF0000' },
      { name: 'brand', sourceHex: '#00FF00' },
    ],
  })
  assert.throws(() => dupCustom.export('w3c'), /Token key collision in exportW3cDesignTokens/)
})
