import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from './hex-to-okyct.ts'
import { hexToRgb } from './hex-to-rgb.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'

describe('hexToOkyct', () => {
  it('matches rgbToOkyct(hexToRgb(hex)) for 3-digit and 6-digit hex inputs', () => {
    for (const hex of ['#000000', '#FFFFFF', '#f0a', '#2563EB', '#EF4444', '#10B981', '#FFD600', '#7C4DFF']) {
      assert.deepEqual(hexToOkyct(hex), rgbToOkyct(hexToRgb(hex)))
    }
  })

  it('maps chromatic and achromatic seeds into expected OKYCT regions', () => {
    const black = hexToOkyct('#000000')
    assert.equal(black.t, 0)
    assert.equal(black.c, 0)

    const yellow = hexToOkyct('#FFD600')
    assert.ok(yellow.t > 80)
    assert.ok(yellow.h > 80 && yellow.h < 110)

    const blue = hexToOkyct('#2563EB')
    assert.ok(blue.h > 240 && blue.h < 280)
    assert.ok(blue.c > 0.15)
    assert.ok(blue.t > 35 && blue.t < 55)
  })

  it('propagates hexToRgb validation errors on invalid hex inputs', () => {
    assert.throws(() => hexToOkyct('invalid'), /Invalid hex/)
  })
})
