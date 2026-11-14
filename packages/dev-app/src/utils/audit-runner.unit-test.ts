import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDynamicScheme, createPalettesFromSource } from '@sandlada/okyct'
import {
  analyzePaletteStops,
  analyzeSeedColor,
  calculatePixelPower,
  sRgbToLinear,
  verifyGamutCompliance,
  verifyTokenCompleteness,
} from './audit-runner.ts'

test('audit-runner analyzes seed colors, pixel power, palette stops, and scheme compliance', () => {
  assert.equal(sRgbToLinear(0), 0)
  assert.equal(sRgbToLinear(1), 1)
  assert.equal(calculatePixelPower(0, 0, 0), 0)
  assert.ok(calculatePixelPower(255, 255, 255) > 0)

  const seed = analyzeSeedColor('#2563EB')
  assert.equal(seed.hex.toLowerCase(), '#2563eb')

  const palettes = createPalettesFromSource('#2563EB')
  const stops = analyzePaletteStops(palettes.primary, '#2563EB')
  assert.ok(stops.length > 0)

  const scheme = buildDynamicScheme('#2563EB', { mode: 'light' })
  assert.equal(verifyGamutCompliance(scheme).totalTokensChecked > 0, true)
  assert.ok(verifyTokenCompleteness(scheme).length > 0)
})
