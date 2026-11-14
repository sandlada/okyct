import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { srgbToLinear } from '../srgb-to-linear.ts'
import { SrgbByteToLinearLut } from './srgb-lut.ts'

describe('SrgbByteToLinearLut', () => {
  it('matches srgbToLinear(i / 255) for all 256 byte entries and increases monotonically', () => {
    assert.equal(SrgbByteToLinearLut.length, 256)
    assert.equal(SrgbByteToLinearLut[0], 0)
    assert.equal(SrgbByteToLinearLut[255], 1)

    let prev = -1
    for (let i = 0; i < 256; i++) {
      const val = SrgbByteToLinearLut[i]
      assert.ok(val > prev)
      assert.ok(Math.abs(val - srgbToLinear(i / 255)) < 1e-12)
      prev = val
    }
  })
})
