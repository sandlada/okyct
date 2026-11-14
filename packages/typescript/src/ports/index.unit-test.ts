import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CssSchemeModes,
  DefaultEmissivePanelSpecs,
  EmissivePanelTypes,
  PaletteVariants,
  StandardTones,
  ThemeModes,
} from './index.ts'

test('ports barrel re-exports inbound and outbound port constants', () => {
  assert.ok(StandardTones.includes(50))
  assert.ok(PaletteVariants.includes('tonalSpot'))
  assert.deepEqual(ThemeModes, ['light', 'dark'])
  assert.ok(EmissivePanelTypes.includes('amoled-anti-smear'))
  assert.equal(DefaultEmissivePanelSpecs['oled-true-black'].darkSurfaceTones.surface, 0)
  assert.deepEqual(CssSchemeModes, ['class', 'light-dark'])
})
