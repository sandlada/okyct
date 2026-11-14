import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from './hex-to-okyct.ts'
import { okyctToHex } from './okyct-to-hex.ts'
import { shortestHueDelta } from './shortest-hue-delta.ts'

describe('okyctToHex', () => {
  it('formats lowercase #rrggbb and roundtrips with hexToOkyct', () => {
    assert.equal(okyctToHex({ h: 200, c: 0.2, t: 0 }), '#000000')
    assert.equal(okyctToHex({ h: 200, c: 0.2, t: 100 }), '#ffffff')

    for (const hex of ['#000000', '#ffffff', '#2563eb', '#ef4444', '#10b981', '#7c4dff']) {
      assert.equal(okyctToHex(hexToOkyct(hex)), hex)
    }
  })

  it('preserves hue across both preserve-tone and cusp-compress modes', () => {
    for (const gamutMapping of ['preserve-tone', 'cusp-compress'] as const) {
      const hex = okyctToHex({ h: 250, c: 0.35, t: 45 }, { gamutMapping })
      assert.match(hex, /^#[0-9a-f]{6}$/)
      const measured = hexToOkyct(hex)
      assert.ok(shortestHueDelta(measured.h, 250) < 0.6)
    }
  })

  it('throws when gamut is set to display-p3 or coordinates are invalid', () => {
    assert.throws(
      () => okyctToHex({ h: 250, c: 0.2, t: 50 }, { gamut: 'display-p3' }),
      /use okyctToDisplayP3Css/,
    )
    assert.throws(() => okyctToHex({ h: 250, c: -0.1, t: 50 }), /Invalid OKYCT coordinates/)
  })
})
