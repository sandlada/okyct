import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { okyctToRgb } from './okyct-to-rgb.ts'
import { rgbToOkyct } from './rgb-to-okyct.ts'
import { shortestHueDelta } from './shortest-hue-delta.ts'
import type { GamutMappingMode, GamutTarget, OKYCT } from '../models/index.ts'

describe('okyctToRgb', () => {
  it('maps boundary Tones 0 and 100 to exact black and white', () => {
    assert.deepEqual(okyctToRgb({ h: 250, c: 0.2, t: 0 }), { r: 0, g: 0, b: 0 })
    assert.deepEqual(okyctToRgb({ h: 250, c: 0.2, t: 100 }), { r: 1, g: 1, b: 1 })
  })

  it('roundtrips in-gamut colors with rgbToOkyct accurately', () => {
    for (const sample of [
      { r: 0.15, g: 0.4, b: 0.9 },
      { r: 0.85, g: 0.2, b: 0.35 },
      { r: 0.1, g: 0.72, b: 0.5 },
    ]) {
      const restored = okyctToRgb(rgbToOkyct(sample))
      assert.ok(Math.abs(restored.r - sample.r) < 1e-4)
      assert.ok(Math.abs(restored.g - sample.g) < 1e-4)
      assert.ok(Math.abs(restored.b - sample.b) < 1e-4)
    }
  })

  it('maps out-of-gamut colors under preserve-tone and cusp-compress with hue preservation', () => {
    for (const gamutMapping of ['preserve-tone', 'cusp-compress'] as const) {
      for (const gamut of ['srgb', 'display-p3'] as const) {
        const rgb = okyctToRgb({ h: 250, c: 0.5, t: 50 }, { gamut, gamutMapping })
        assert.ok(rgb.r >= 0 && rgb.r <= 1)
        assert.ok(rgb.g >= 0 && rgb.g <= 1)
        assert.ok(rgb.b >= 0 && rgb.b <= 1)
      }
    }

    const mappedPreserve = rgbToOkyct(okyctToRgb({ h: 145, c: 0.45, t: 80 }, { gamutMapping: 'preserve-tone' }))
    assert.ok(Math.abs(mappedPreserve.t - 80) < 0.05)
    assert.ok(shortestHueDelta(mappedPreserve.h, 145) < 0.5)

    const mappedCusp = rgbToOkyct(okyctToRgb({ h: 145, c: 0.45, t: 80 }, { gamutMapping: 'cusp-compress' }))
    assert.ok(mappedCusp.c > 0)
    assert.ok(shortestHueDelta(mappedCusp.h, 145) < 0.5)
  })

  it('throws on invalid objects, coordinates, gamut, or gamutMapping', () => {
    assert.throws(() => okyctToRgb(null as unknown as OKYCT), /Invalid OKYCT input/)
    assert.throws(() => okyctToRgb({ h: Number.NaN, c: 0.1, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToRgb({ h: 200, c: -0.1, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToRgb({ h: 200, c: 0.1, t: -1 }), /Invalid OKYCT coordinates/)
    assert.throws(() => okyctToRgb({ h: 200, c: 0.1, t: 101 }), /Invalid OKYCT coordinates/)
    assert.throws(
      () => okyctToRgb({ h: 200, c: 0.1, t: 50 }, { gamut: 'xyz' as GamutTarget }),
      /Invalid gamut target/,
    )
    assert.throws(
      () => okyctToRgb({ h: 200, c: 0.1, t: 50 }, { gamutMapping: 'clip' as GamutMappingMode }),
      /Invalid gamutMapping mode/,
    )
  })
})
