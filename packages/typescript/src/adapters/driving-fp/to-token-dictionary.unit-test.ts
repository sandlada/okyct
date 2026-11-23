import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { toTokenDictionary } from './to-token-dictionary.ts'

test('toTokenDictionary normalizes DynamicSchemeColors into a plain TokenDictionary', () => {
  const theme = createTheme('#2563EB')
  const dict = toTokenDictionary(theme.schemes.light)
  assert.equal(dict.primary, theme.schemes.light.primary)
})

test('toTokenDictionary throws on custom color collisions with system roles, derived roles, or state layers', () => {
  const sysCollision = createTheme({ sourceHex: '#2563EB', customColors: { primary: '#FF0000' } })
  assert.throws(() => sysCollision.tokens('light'), /Token key collision in toTokenDictionary/)

  const customCollision = createTheme({
    sourceHex: '#2563EB',
    customColors: [
      { name: 'brandBlue', sourceHex: '#FF0000' },
      { name: 'brand-blue', sourceHex: '#00FF00' },
    ],
  })
  assert.throws(
    () => toTokenDictionary(customCollision.schemes.light, customCollision.customColors.light),
    /Token key collision in toTokenDictionary/
  )

  const derivedCollision = createTheme({
    sourceHex: '#2563EB',
    customColors: [
      { name: 'foo', sourceHex: '#FF0000' },
      { name: 'onFoo', sourceHex: '#00FF00' },
    ],
  })
  assert.throws(() => derivedCollision.tokens('light'), /Token key collision in toTokenDictionary/)

  const stateCollision = createTheme({
    sourceHex: '#2563EB',
    stateLayers: true,
    customColors: { primaryHovered: '#FF0000' },
  })
  assert.throws(() => stateCollision.tokens('light'), /Token key collision in toTokenDictionary/)
})
