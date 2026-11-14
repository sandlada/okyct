import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { okyctToOklchCss } from './okyct-to-oklch-css.ts'
import type { OKYCT } from '../models/index.ts'

describe('okyctToOklchCss', () => {
  it('formats black, white, and chromatic OKYCT coordinates into valid oklch() CSS strings', () => {
    assert.equal(okyctToOklchCss({ h: 0, c: 0, t: 0 }), 'oklch(0.00% 0.0000 0.00)')
    assert.equal(okyctToOklchCss({ h: 0, c: 0, t: 100 }), 'oklch(100.00% 0.0000 0.00)')

    const css = okyctToOklchCss({ h: 250, c: 0.14, t: 50 })
    assert.match(css, /^oklch\(\d+\.\d{2}% 0\.1400 250\.00\)$/)
  })

  it('normalizes negative and multi-turn hue angles into [0, 360)', () => {
    const negHue = okyctToOklchCss({ h: -30, c: 0.1, t: 60 })
    assert.ok(negHue.endsWith('330.00)'))

    const wrappedHue = okyctToOklchCss({ h: 360, c: 0.1, t: 60 })
    assert.ok(wrappedHue.endsWith('0.00)'))
  })

  it('throws on null, non-object, or invalid OKYCT coordinates', () => {
    assert.throws(() => okyctToOklchCss(null as unknown as OKYCT), /Invalid OKYCT input/)
    assert.throws(() => okyctToOklchCss({ h: Number.NaN, c: 0.1, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToOklchCss({ h: 200, c: -0.05, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToOklchCss({ h: 200, c: 0.1, t: -1 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToOklchCss({ h: 200, c: 0.1, t: 101 }), /Invalid OKYCT coordinates/)
  })
})
