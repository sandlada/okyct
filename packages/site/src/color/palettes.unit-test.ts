import test from 'node:test'
import assert from 'node:assert/strict'
import { TonalPalette, createPalettesFromSource } from './palettes.ts'

test('color/palettes facade re-exports TonalPalette and createPalettesFromSource', () => {
  const palettes = createPalettesFromSource('#2563EB')
  assert.ok(palettes.primary instanceof TonalPalette)
})
