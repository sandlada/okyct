import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EmissivePanelTypes,
  StandardTones,
  TonalPalette,
  buildDynamicScheme,
  createTheme,
  hexToOkyct,
  okyctToHex,
  verifyHexagonalArchitectureBoundaries,
} from './index.ts'

test('root index barrel exports core APIs and constants', () => {
  assert.equal(verifyHexagonalArchitectureBoundaries().passed, true)
  assert.ok(StandardTones.includes(40))
  assert.ok(EmissivePanelTypes.includes('oled-true-black'))

  const palette = TonalPalette.fromHex('#2563EB')
  assert.match(palette.tone(40), /^#[0-9a-f]{6}$/i)

  const okyct = hexToOkyct('#2563EB')
  assert.match(okyctToHex(okyct), /^#[0-9a-f]{6}$/i)

  const scheme = buildDynamicScheme('#2563EB', { variant: 'tonalSpot', mode: 'light' })
  assert.ok(scheme.primary)

  const theme = createTheme('#2563EB')
  assert.ok(theme.schemes.light.primary)
  assert.ok(theme.schemes.dark.primary)
})
