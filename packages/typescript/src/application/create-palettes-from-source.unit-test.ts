import test from 'node:test'
import assert from 'node:assert/strict'
import { createPalettesFromSource } from './create-palettes-from-source.ts'

test('createPalettesFromSource generates all 6 tonal palettes for every variant', () => {
  const palettes = createPalettesFromSource('#2563EB', { variant: 'vibrant' })
  assert.ok(palettes.primary)
  assert.ok(palettes.secondary)
  assert.ok(palettes.tertiary)
  assert.ok(palettes.error)
  assert.ok(palettes.neutral)
  assert.ok(palettes.neutralVariant)
  assert.match(palettes.primary.tone(40), /^#[0-9a-f]{6}$/i)
})
