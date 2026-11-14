import test from 'node:test'
import assert from 'node:assert/strict'
import { SrgbByteToLinearLut } from './srgb-lut.ts'

test('SrgbByteToLinearLut maps 256 byte values monotonically from 0 to 1', () => {
  assert.equal(SrgbByteToLinearLut.length, 256)
  assert.equal(SrgbByteToLinearLut[0], 0)
  assert.equal(SrgbByteToLinearLut[255], 1)
  assert.ok(SrgbByteToLinearLut[128] > SrgbByteToLinearLut[64])
})
