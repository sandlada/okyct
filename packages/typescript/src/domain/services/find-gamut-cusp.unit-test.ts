import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findGamutCusp } from './find-gamut-cusp.ts'
import type { GamutTarget } from '../models/index.ts'

describe('findGamutCusp', () => {
  it('locates gamut cusp across all 6 chromatic sextants for srgb and display-p3', () => {
    for (const hue of [0, 29, 60, 109, 145, 195, 264, 300, 328]) {
      const srgbCusp = findGamutCusp(hue, { gamut: 'srgb' })
      const p3Cusp = findGamutCusp(hue, { gamut: 'display-p3' })
      const defaultCusp = findGamutCusp(hue)

      assert.deepEqual(defaultCusp, srgbCusp)
      assert.ok(srgbCusp.tone > 0 && srgbCusp.tone < 100)
      assert.ok(srgbCusp.chroma > 0.1)
      assert.ok(p3Cusp.tone > 0 && p3Cusp.tone < 100)
      assert.ok(p3Cusp.chroma >= srgbCusp.chroma)
    }
  })

  it('is invariant under 360-degree hue wrap-around and negative hues', () => {
    const base = findGamutCusp(300)
    const neg = findGamutCusp(-60)
    const wrapped = findGamutCusp(660)

    assert.ok(Math.abs(base.tone - neg.tone) < 1e-6)
    assert.ok(Math.abs(base.chroma - neg.chroma) < 1e-6)
    assert.ok(Math.abs(base.tone - wrapped.tone) < 1e-6)
    assert.ok(Math.abs(base.chroma - wrapped.chroma) < 1e-6)
  })

  it('throws on non-finite hues or invalid gamut target', () => {
    assert.throws(() => findGamutCusp(Number.NaN), /Invalid hue/)
    assert.throws(() => findGamutCusp(Number.POSITIVE_INFINITY), /Invalid hue/)
    assert.throws(
      () => findGamutCusp(120, { gamut: 'adobe-rgb' as GamutTarget }),
      /Invalid gamut target/,
    )
  })
})
