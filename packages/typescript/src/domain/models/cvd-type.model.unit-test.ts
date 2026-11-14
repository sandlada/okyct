import test from 'node:test'
import assert from 'node:assert/strict'
import { CvdTypes, type CvdType } from './cvd-type.model.ts'

test('CvdTypes includes all five simulation modes', () => {
  assert.deepEqual(CvdTypes, [
    'none',
    'protanopia',
    'deuteranopia',
    'tritanopia',
    'achromatopsia',
  ])
  const kind: CvdType = 'tritanopia'
  assert.ok(CvdTypes.includes(kind))
})
