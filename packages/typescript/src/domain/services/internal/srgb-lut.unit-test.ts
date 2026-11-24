import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { srgbToLinear } from '../srgb-to-linear.ts'
import { HexNibbleLut, parseHexToRgb24, SrgbByteToLinearLut, SrgbByteToUnitLut } from './srgb-lut.ts'

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

describe('SrgbByteToUnitLut and HexNibbleLut', () => {
  it('maps byte [0..255] to i / 255 exactly and decodes ASCII hex nibbles cleanly', () => {
    assert.equal(SrgbByteToUnitLut.length, 256)
    assert.equal(SrgbByteToUnitLut[0], 0)
    assert.equal(SrgbByteToUnitLut[255], 1)
    for (let i = 0; i < 256; i++) {
      assert.equal(SrgbByteToUnitLut[i], i / 255)
    }

    assert.equal(HexNibbleLut.length, 128)
    assert.equal(HexNibbleLut['0'.charCodeAt(0)], 0)
    assert.equal(HexNibbleLut['9'.charCodeAt(0)], 9)
    assert.equal(HexNibbleLut['A'.charCodeAt(0)], 10)
    assert.equal(HexNibbleLut['F'.charCodeAt(0)], 15)
    assert.equal(HexNibbleLut['a'.charCodeAt(0)], 10)
    assert.equal(HexNibbleLut['f'.charCodeAt(0)], 15)
    assert.equal(HexNibbleLut['g'.charCodeAt(0)], -1)
    assert.equal(HexNibbleLut['#'.charCodeAt(0)], -1)
  })
})

describe('parseHexToRgb24', () => {
  it('parses 3-digit and 6-digit hex strings with or without # and ASCII whitespace into 24-bit integers', () => {
    assert.equal(parseHexToRgb24('#000000'), 0x000000)
    assert.equal(parseHexToRgb24('#ffffff'), 0xffffff)
    assert.equal(parseHexToRgb24('2563EB'), 0x2563eb)
    assert.equal(parseHexToRgb24(' \t\n\r\f#0aF\f\r\n\t '), 0x00aaff)
    assert.equal(parseHexToRgb24('f80'), 0xff8800)
  })

  it('throws on non-string, non-ASCII whitespace, and invalid hex formats', () => {
    assert.throws(() => parseHexToRgb24(123 as unknown as string), /Invalid hex color input/)
    assert.throws(() => parseHexToRgb24(''), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('\u0085#fff'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('\uFEFF#fff'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('\u00a0#123\u00a0'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('\u3000#fff'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('#12345'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('#1234567'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('##12345'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('#12g'), /Invalid hex color format/)
    assert.throws(() => parseHexToRgb24('#12\u0100456'), /Invalid hex color format/)
  })
})
