import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { okyctToDisplayP3Css } from './okyct-to-display-p3-css.ts'
import type { GamutMappingMode, OKYCT } from '../models/index.ts'

describe('okyctToDisplayP3Css', () => {
  it('formats black, white, and chromatic colors as CSS color(display-p3 r g b)', () => {
    assert.equal(okyctToDisplayP3Css({ h: 0, c: 0, t: 0 }), 'color(display-p3 0.0000 0.0000 0.0000)')
    assert.equal(okyctToDisplayP3Css({ h: 0, c: 0, t: 100 }), 'color(display-p3 1.0000 1.0000 1.0000)')

    const preserveCss = okyctToDisplayP3Css({ h: 250, c: 0.22, t: 50 })
    assert.match(preserveCss, /^color\(display-p3 \d\.\d{4} \d\.\d{4} \d\.\d{4}\)$/)

    const cuspCss = okyctToDisplayP3Css({ h: 145, c: 0.45, t: 80 }, { gamutMapping: 'cusp-compress' })
    assert.match(cuspCss, /^color\(display-p3 \d\.\d{4} \d\.\d{4} \d\.\d{4}\)$/)
  })

  it('throws on invalid OKYCT input or invalid gamutMapping option', () => {
    assert.throws(() => okyctToDisplayP3Css(null as unknown as OKYCT), /Invalid OKYCT/)
    assert.throws(
      () => okyctToDisplayP3Css({ h: 250, c: 0.1, t: 50 }, { gamutMapping: 'clip' as GamutMappingMode }),
      /Invalid gamutMapping mode/,
    )
  })
})
