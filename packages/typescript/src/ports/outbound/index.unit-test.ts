import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CssSchemeModes,
  DefaultEmissivePanelSpecs,
  SubpixelGeometries,
  TailwindFallbackModes,
} from './index.ts'

test('ports/outbound barrel re-exports display physics and token exporter constants', () => {
  assert.ok(SubpixelGeometries.includes('diamond-pentile'))
  assert.equal(DefaultEmissivePanelSpecs['amoled-anti-smear'].darkSurfaceTones.surface, 4)
  assert.deepEqual(CssSchemeModes, ['class', 'light-dark'])
  assert.deepEqual(TailwindFallbackModes, ['none', 'light-dark'])
})
