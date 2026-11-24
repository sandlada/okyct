import test from 'node:test'
import assert from 'node:assert/strict'
import { createPalettesFromSource } from '../../color/palettes.ts'
import {
  buildCustomPaletteSet,
  createPresetRoleMap,
  isSourceWarmHue,
  normalizeHue,
} from './presets.ts'

test('normalizeHue wraps negative and >=360 angles into [0, 360)', () => {
  assert.equal(normalizeHue(-15), 345)
  assert.equal(normalizeHue(375), 15)
  assert.equal(normalizeHue(0), 0)
})

test('buildCustomPaletteSet matches createPalettesFromSource for tonalSpot and expressive', () => {
  const seed = '#1A73E8'
  const warm = isSourceWarmHue(seed)

  for (const variant of ['tonalSpot', 'expressive', 'vibrant', 'neutral', 'monochrome', 'fidelity'] as const) {
    const expected = createPalettesFromSource(seed, { variant, harmonizeSemantics: true })
    const actual = buildCustomPaletteSet(seed, createPresetRoleMap(variant, warm), true)

    assert.ok(Math.abs(actual.primary.hue - expected.primary.hue) < 1e-6)
    assert.ok(Math.abs(actual.secondary.hue - expected.secondary.hue) < 1e-6)
    assert.ok(Math.abs(actual.tertiary.hue - expected.tertiary.hue) < 1e-6)
    assert.ok(Math.abs(actual.primary.targetChroma - expected.primary.targetChroma) < 1e-6)
    assert.ok(Math.abs(actual.secondary.targetChroma - expected.secondary.targetChroma) < 1e-6)
    assert.ok(Math.abs(actual.tertiary.targetChroma - expected.tertiary.targetChroma) < 1e-6)
  }
})
