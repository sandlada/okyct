import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from './create-theme.ts'

test('createTheme builds complete light and dark schemes with palettes and customColors', () => {
  const theme = createTheme({
    sourceHex: '#2563EB',
    variant: 'tonalSpot',
    customColors: [{ name: 'brand', sourceHex: '#10B981' }],
  })
  assert.equal(theme.sourceHex, '#2563EB')
  assert.ok(theme.palettes.primary)
  assert.ok(theme.schemes.light.primary)
  assert.ok(theme.schemes.dark.primary)
  assert.equal(theme.customColors.light.length, 1)
})
