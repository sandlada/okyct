import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ContrastMetrics,
  CvdTypes,
  GamutMappingModes,
  GamutTargets,
} from './index.ts'
import type { OKYCT, RGB } from './index.ts'

test('domain models barrel exports runtime constants and types', () => {
  assert.equal(ContrastMetrics.length, 3)
  assert.equal(CvdTypes.length, 5)
  assert.equal(GamutMappingModes.length, 2)
  assert.equal(GamutTargets.length, 2)

  const sampleRgb: RGB = { r: 255, g: 128, b: 0 }
  const sampleOkyct: OKYCT = { h: 45, c: 0.15, t: 60 }
  assert.equal(sampleRgb.r, 255)
  assert.equal(sampleOkyct.t, 60)
})
