import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TonalPalette,
  auditSchemeContrast,
  createPalettesFromSource,
  harmonizeHex,
  isWarmHue,
  stackLayers,
} from './index.ts'

test('application barrel exports palette, scheme, harmonize, and stacking APIs', () => {
  const palettes = createPalettesFromSource('#2563EB')
  assert.ok(palettes.primary instanceof TonalPalette)
  assert.equal(isWarmHue(30), true)
  assert.match(harmonizeHex('#EF4444', '#2563EB'), /^#[0-9a-f]{6}$/i)
  assert.match(stackLayers()([{ color: '#FFFFFF', opacity: 0.1 }])('#2563EB').finalHex, /^#[0-9a-f]{6}$/i)
  assert.equal(typeof auditSchemeContrast, 'function')
})
