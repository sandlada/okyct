import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ContrastMetrics,
  CvdTypes,
  GamutMappingModes,
  GamutTargets,
  hexToOkyct,
  okyctToHex,
  toneToY,
  yToTone,
} from './index.ts'

test('domain barrel re-exports models and services', () => {
  assert.deepEqual(ContrastMetrics, ['wcag', 'apca', 'both'])
  assert.ok(CvdTypes.includes('deuteranopia'))
  assert.deepEqual(GamutTargets, ['srgb', 'display-p3'])
  assert.deepEqual(GamutMappingModes, ['preserve-tone', 'cusp-compress'])

  assert.equal(yToTone(toneToY(50)).toFixed(4), '50.0000')
  const okyct = hexToOkyct('#10B981')
  assert.match(okyctToHex(okyct), /^#[0-9a-f]{6}$/i)
})
