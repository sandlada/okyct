import test from 'node:test'
import assert from 'node:assert/strict'
import { createPalettesFromSource } from './create-palettes-from-source.ts'
import type { PaletteSet } from './palette-set.ts'

test('PaletteSet type matches output of createPalettesFromSource', () => {
  const set: PaletteSet = createPalettesFromSource('#10B981')
  assert.match(set.neutral.tone(10), /^#[0-9a-f]{6}$/i)
})
