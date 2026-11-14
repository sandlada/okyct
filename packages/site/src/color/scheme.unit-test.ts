import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  SystemColorTokens,
  buildDynamicScheme,
  createTheme,
} from './scheme.ts'

describe('color/scheme facade', () => {
  it('re-exports buildDynamicScheme, createTheme, and SystemColorTokens', () => {
    assert.ok(Array.isArray(SystemColorTokens))
    assert.ok(SystemColorTokens.length > 0)
    const theme = createTheme('#1A73E8')
    assert.ok(theme.palettes.primary)
    const scheme = buildDynamicScheme(theme.palettes, { mode: 'light' })
    assert.match(scheme.primary, /^#[0-9a-f]{6}$/i)
  })
})
