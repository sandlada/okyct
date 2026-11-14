import test from 'node:test'
import assert from 'node:assert/strict'
import {
  findGamutCusp,
  getContrastRatio,
  hexToOkyct,
  okyctToHex,
  runColorimetricInvariantSuite,
  toneToY,
  yToTone,
} from './index.ts'

test('domain/services barrel exports core colorimetric functions', () => {
  assert.equal(yToTone(toneToY(40)).toFixed(3), '40.000')
  assert.ok(findGamutCusp(250).chroma > 0)
  assert.ok(getContrastRatio(100, 0) >= 20.9)
  assert.match(okyctToHex(hexToOkyct('#2563EB')), /^#[0-9a-f]{6}$/i)
  assert.equal(runColorimetricInvariantSuite().every((r) => r.passed), true)
})
