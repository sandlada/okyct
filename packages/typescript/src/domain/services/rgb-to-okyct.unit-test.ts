import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { rgbToOkyct } from './rgb-to-okyct.ts'
import type { RGB } from '../models/index.ts'

describe('rgbToOkyct', () => {
  it('converts neutral grays with near-zero chroma and monotonic Tone', () => {
    const black = rgbToOkyct({ r: 0, g: 0, b: 0 })
    assert.equal(black.t, 0)
    assert.equal(black.c, 0)

    const midGray = rgbToOkyct({ r: 0.5, g: 0.5, b: 0.5 })
    assert.ok(midGray.c < 1e-4)
    assert.ok(midGray.t > 50 && midGray.t < 56)

    const white = rgbToOkyct({ r: 1, g: 1, b: 1 })
    assert.ok(white.c < 1e-4)
    assert.ok(Math.abs(white.t - 100) < 1e-4)
  })

  it('normalizes hue into [0, 360) for positive and negative OKLab b coordinates', () => {
    const red = rgbToOkyct({ r: 1, g: 0, b: 0 })
    assert.ok(red.h >= 20 && red.h <= 40)
    assert.ok(red.c > 0.2)

    const blue = rgbToOkyct({ r: 0, g: 0, b: 1 })
    assert.ok(blue.h >= 250 && blue.h <= 280)
    assert.ok(blue.c > 0.25)

    const cyan = rgbToOkyct({ r: 0, g: 1, b: 1 })
    assert.ok(cyan.h >= 180 && cyan.h <= 210)
    assert.ok(cyan.t > 85)
  })

  it('throws on null, non-object, or non-finite RGB channels', () => {
    assert.throws(() => rgbToOkyct(null as unknown as RGB), /Invalid RGB input/)
    assert.throws(() => rgbToOkyct('blue' as unknown as RGB), /Invalid RGB input/)
    assert.throws(() => rgbToOkyct({ r: Number.NaN, g: 0.5, b: 0.5 }), /Invalid RGB input/)
    assert.throws(() => rgbToOkyct({ r: 0.5, g: Number.POSITIVE_INFINITY, b: 0.5 }), /Invalid RGB input/)
    assert.throws(() => rgbToOkyct({ r: 0.5, g: 0.5, b: Number.NEGATIVE_INFINITY }), /Invalid RGB input/)
  })
})
