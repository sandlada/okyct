import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DefaultEmissivePanelSpecs,
  EmissivePanelTypes,
  SubpixelGeometries,
} from './display-physics.port.ts'

test('DefaultEmissivePanelSpecs defines specs for every EmissivePanelType', () => {
  for (const panel of EmissivePanelTypes) {
    const spec = DefaultEmissivePanelSpecs[panel]
    assert.ok(spec)
    assert.ok(SubpixelGeometries.includes(spec.subpixelGeometry))
    assert.ok(spec.darkSurfaceTones.surface >= 0 && spec.darkSurfaceTones.surface <= 10)
    assert.ok(spec.lightPeakToneCap >= 90 && spec.lightPeakToneCap <= 100)
  }
  assert.equal(DefaultEmissivePanelSpecs['oled-true-black'].darkSurfaceTones.surface, 0)
  assert.equal(DefaultEmissivePanelSpecs['amoled-anti-smear'].darkSurfaceTones.surface, 4)
  assert.equal(DefaultEmissivePanelSpecs['micro-oled-xr'].lightPeakToneCap, 92)
})

test('DefaultEmissivePanelSpecs is deeply frozen against runtime mutation', () => {
  assert.equal(Object.isFrozen(DefaultEmissivePanelSpecs), true)
  assert.equal(Object.isFrozen(DefaultEmissivePanelSpecs['standard-lcd']), true)
  assert.equal(Object.isFrozen(DefaultEmissivePanelSpecs['standard-lcd'].darkSurfaceTones), true)
  assert.throws(() => {
    ;(DefaultEmissivePanelSpecs['standard-lcd'].darkSurfaceTones as { surface: number }).surface = 99
  }, TypeError)
  assert.equal(DefaultEmissivePanelSpecs['standard-lcd'].darkSurfaceTones.surface, 6)
})
