import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hexToRgb } from './hex-to-rgb.ts'

describe('hexToRgb', () => {
  it('parses 6-digit hex strings with or without # and in any casing', () => {
    const blue = hexToRgb('#2563EB')
    assert.ok(Math.abs(blue.r - 37 / 255) < 1e-9)
    assert.ok(Math.abs(blue.g - 99 / 255) < 1e-9)
    assert.ok(Math.abs(blue.b - 235 / 255) < 1e-9)

    assert.deepEqual(hexToRgb('2563eb'), blue)
    assert.deepEqual(hexToRgb('#000000'), { r: 0, g: 0, b: 0 })
    assert.deepEqual(hexToRgb('#FFFFFF'), { r: 1, g: 1, b: 1 })
  })

  it('expands 3-digit shorthand hex strings with or without #', () => {
    const rose = hexToRgb('#f0a')
    assert.deepEqual(rose, hexToRgb('#ff00aa'))
    assert.deepEqual(hexToRgb('0f0'), { r: 0, g: 1, b: 0 })
  })

  it('trims surrounding ASCII whitespace before parsing and rejects non-ASCII whitespace', () => {
    assert.deepEqual(hexToRgb(' \t\n\r\f#10b981 \n\t\r\f '), hexToRgb('#10B981'))
    assert.throws(() => hexToRgb('\u0085#10b981'), /Invalid hex color format/)
    assert.throws(() => hexToRgb('\uFEFF#10b981'), /Invalid hex color format/)
    assert.throws(() => hexToRgb('\u00A0#10b981'), /Invalid hex color format/)
  })

  it('throws on non-string inputs and malformed hex formats', () => {
    assert.throws(() => hexToRgb(null as unknown as string), /expected string/)
    assert.throws(() => hexToRgb(123 as unknown as string), /expected string/)

    for (const bad of ['', '#', '#12', '#1234', '#12345', '#12345678', '#GGGGGG', 'not-a-hex']) {
      assert.throws(() => hexToRgb(bad), /Invalid hex color format/)
    }
  })
})
