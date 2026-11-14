import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from '../hex-to-okyct.ts'
import { okyctToRgb } from '../okyct-to-rgb.ts'
import { shortestHueDelta } from '../shortest-hue-delta.ts'
import { snapRgbToHexForHuePreserve } from './snap-rgb-for-hue-preserve.ts'

describe('snapRgbToHexForHuePreserve', () => {
  it('handles black, white, and near-achromatic fast-paths cleanly', () => {
    assert.equal(snapRgbToHexForHuePreserve({ r: 0, g: 0, b: 0 }, 0, 0), '#000000')
    assert.equal(snapRgbToHexForHuePreserve({ r: 1, g: 1, b: 1 }, 0, 100), '#ffffff')
    assert.equal(snapRgbToHexForHuePreserve({ r: 0.5, g: 0.5, b: 0.5 }, 0, 53.5, 0), '#808080')
    assert.equal(snapRgbToHexForHuePreserve({ r: 0.5, g: 0.5, b: 0.5 }, 0, 53.5), '#808080')
  })

  it('optimizes 8-vertex rounding in standard and dark tone regimes within hue budget', () => {
    const blueHex = snapRgbToHexForHuePreserve({ r: 0.145, g: 0.388, b: 0.922 }, 263, 45, 0.18)
    assert.match(blueHex, /^#[0-9a-f]{6}$/)

    const darkRgb = okyctToRgb({ h: 27, c: 0.04, t: 6.5 })
    const darkRed = snapRgbToHexForHuePreserve(darkRgb, 27, 6.5, 0.04)
    assert.match(darkRed, /^#[0-9a-f]{6}$/)
    const measured = hexToOkyct(darkRed)
    assert.ok(Math.abs(measured.t - 6.5) <= 0.6)
    assert.ok(shortestHueDelta(measured.h, 27) < 2)
  })
})
