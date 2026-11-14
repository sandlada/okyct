import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hexToRgb } from './hex-to-rgb.ts'
import { rgbToHex } from './rgb-to-hex.ts'

describe('rgbToHex', () => {
  it('formats lowercase 6-digit hex strings from normalized [0, 1] RGB', () => {
    assert.equal(rgbToHex({ r: 0, g: 0, b: 0 }), '#000000')
    assert.equal(rgbToHex({ r: 1, g: 1, b: 1 }), '#ffffff')
    assert.equal(rgbToHex({ r: 1, g: 0, b: 0 }), '#ff0000')
    assert.equal(rgbToHex({ r: 37 / 255, g: 99 / 255, b: 235 / 255 }), '#2563eb')
  })

  it('zero-pads single-digit hex channel values cleanly', () => {
    assert.equal(rgbToHex({ r: 1 / 255, g: 10 / 255, b: 15 / 255 }), '#010a0f')
  })

  it('clamps out-of-range RGB values to [00, ff]', () => {
    assert.equal(rgbToHex({ r: -0.25, g: 1.75, b: 0 }), '#00ff00')
  })

  it('roundtrips with hexToRgb across primary and brand colors', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#10b981', '#7c4dff']) {
      assert.equal(rgbToHex(hexToRgb(hex)), hex)
    }
  })

  it('throws on null, non-object, or non-finite RGB channels', () => {
    assert.throws(() => rgbToHex(null as unknown as { r: number; g: number; b: number }), /Invalid RGB input/)
    assert.throws(() => rgbToHex('red' as unknown as { r: number; g: number; b: number }), /Invalid RGB input/)
    assert.throws(() => rgbToHex({ r: Number.NaN, g: 0, b: 0 }), /Invalid RGB input/)
    assert.throws(() => rgbToHex({ r: 0, g: Number.POSITIVE_INFINITY, b: 0 }), /Invalid RGB input/)
    assert.throws(() => rgbToHex({ r: 0, g: 0, b: Number.NEGATIVE_INFINITY }), /Invalid RGB input/)
  })
})
