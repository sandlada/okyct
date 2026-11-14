import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { isInGamut } from './is-in-gamut.ts'
import type { GamutTarget, OKYCT } from '../models/index.ts'

describe('isInGamut', () => {
  it('returns black and white fast-paths at Tone <= 0.001 and Tone >= 99.999', () => {
    const atZero = isInGamut({ h: 250, c: 0.4, t: 0.0005 })
    assert.equal(atZero.inGamut, true)
    assert.deepEqual(atZero.rgb, { r: 0, g: 0, b: 0 })

    const atHundred = isInGamut({ h: 250, c: 0.4, t: 99.9995 })
    assert.equal(atHundred.inGamut, true)
    assert.deepEqual(atHundred.rgb, { r: 1, g: 1, b: 1 })
  })

  it('detects in-gamut and out-of-gamut colors for default srgb and display-p3', () => {
    assert.equal(isInGamut({ h: 250, c: 0.05, t: 50 }).inGamut, true)
    assert.equal(isInGamut({ h: 250, c: 0.05, t: 50 }, { gamut: 'srgb' }).inGamut, true)
    assert.equal(isInGamut({ h: 145, c: 0.45, t: 60 }, { gamut: 'srgb' }).inGamut, false)

    const srgbBoundary = findMaxChromaForTone(145, 60, { gamut: 'srgb' })
    const p3Only: OKYCT = { h: 145, c: srgbBoundary + 0.02, t: 60 }
    assert.equal(isInGamut(p3Only, { gamut: 'srgb' }).inGamut, false)
    assert.equal(isInGamut(p3Only, { gamut: 'display-p3' }).inGamut, true)
  })

  it('throws on invalid objects, invalid gamut targets, or out-of-bounds OKYCT coordinates', () => {
    assert.throws(() => isInGamut(null as unknown as OKYCT), /Invalid OKYCT input/)
    assert.throws(
      () => isInGamut({ h: 200, c: 0.1, t: 50 }, { gamut: 'rec2020' as GamutTarget }),
      /Invalid gamut target/,
    )
    assert.throws(() => isInGamut({ h: Number.NaN, c: 0.1, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => isInGamut({ h: 200, c: -0.01, t: 50 }), /Invalid OKYCT coordinates/)
    assert.throws(() => isInGamut({ h: 200, c: 0.1, t: -1 }), /Invalid OKYCT coordinates/)
    assert.throws(() => isInGamut({ h: 200, c: 0.1, t: 101 }), /Invalid OKYCT coordinates/)
  })
})
