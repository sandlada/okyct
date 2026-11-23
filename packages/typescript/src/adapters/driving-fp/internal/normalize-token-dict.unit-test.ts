import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../../create-theme.ts'
import { nestTokens } from '../nest-tokens.ts'
import { renameCase } from '../rename-case.ts'
import { toTokenDictionary } from '../to-token-dictionary.ts'
import { normalizeTokenDict } from './normalize-token-dict.ts'

test('normalizeTokenDict returns a shallow string dictionary from TokenSource', () => {
  const dict = normalizeTokenDict({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(dict, { primary: '#2563EB', surface: '#FFFFFF' })
})

test('normalizeTokenDict projects real light and dark DynamicSchemeColors with and without stateLayers identically to toTokenDictionary', () => {
  for (const stateLayers of [false, true] as const) {
    const theme = createTheme({ sourceHex: '#2563EB', stateLayers })
    for (const mode of ['light', 'dark'] as const) {
      const scheme = theme.scheme(mode)
      const expected = toTokenDictionary(scheme, [], { includeStateLayers: true })
      assert.deepEqual(normalizeTokenDict(scheme), expected)
      assert.deepEqual(nestTokens()(scheme), nestTokens()(expected))
      assert.deepEqual(renameCase('kebab')(scheme), renameCase('kebab')(expected))
    }
  }
})

test('normalizeTokenDict rejects malformed objects with a tones field', () => {
  assert.throws(
    () => normalizeTokenDict({ tones: {} } as unknown as Parameters<typeof normalizeTokenDict>[0]),
    /Invalid scheme color/
  )
})
