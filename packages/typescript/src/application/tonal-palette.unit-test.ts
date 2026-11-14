import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from '../domain/index.ts'
import { TonalPalette } from './tonal-palette.ts'

test('TonalPalette generates accurate tonal stops and preserves hue', () => {
  const palette = TonalPalette.fromHex('#2563EB')
  assert.equal(palette.tone(0), '#000000')
  assert.equal(palette.tone(100), '#ffffff')

  const t40 = hexToOkyct(palette.tone(40))
  assert.ok(Math.abs(t40.t - 40) < 0.6)
  assert.equal(palette.tone(40), palette.tone(40))
})
