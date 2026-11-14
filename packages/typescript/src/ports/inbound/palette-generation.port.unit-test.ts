import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PaletteVariants,
  StandardPaletteKeys,
  StandardTones,
} from './palette-generation.port.ts'

test('StandardTones contains the 13 canonical tonal stops in ascending order', () => {
  assert.deepEqual(StandardTones, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100])
})

test('PaletteVariants includes standard MD3-inspired variants', () => {
  for (const variant of ['tonalSpot', 'vibrant', 'expressive', 'neutral', 'monochrome', 'fidelity'] as const) {
    assert.ok(PaletteVariants.includes(variant))
  }
})

test('StandardPaletteKeys includes core and semantic palette roles', () => {
  for (const key of ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant', 'error'] as const) {
    assert.ok(StandardPaletteKeys.includes(key))
  }
})
