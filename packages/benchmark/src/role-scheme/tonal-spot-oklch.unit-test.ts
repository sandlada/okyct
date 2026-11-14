import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTonalSpotOklchPalettes } from './tonal-spot-oklch.ts'

test('buildTonalSpotOklchPalettes builds hue/chroma axes for all benchmark palette slots', () => {
  const palettes = buildTonalSpotOklchPalettes('#2563EB')
  assert.ok(palettes.primary.c > 0)
  assert.ok(palettes.neutral.c < palettes.primary.c)
})
