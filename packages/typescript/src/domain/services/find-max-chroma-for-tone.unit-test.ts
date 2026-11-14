import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { findMaxChromaForTone } from './find-max-chroma-for-tone.ts'
import { isInGamut } from './is-in-gamut.ts'
import type { GamutTarget } from '../models/index.ts'

describe('findMaxChromaForTone', () => {
  it('returns 0 at black and white Tone boundaries', () => {
    assert.equal(findMaxChromaForTone(250, 0), 0)
    assert.equal(findMaxChromaForTone(250, 0.0005), 0)
    assert.equal(findMaxChromaForTone(250, 99.9995), 0)
    assert.equal(findMaxChromaForTone(250, 100), 0)
  })

  it('finds exact gamut boundary chroma inside srgb and display-p3 across hues and tones', () => {
    for (const gamut of ['srgb', 'display-p3'] as const) {
      for (const h of [0, 90, 145, 250]) {
        for (const t of [20, 50, 80]) {
          const maxC = findMaxChromaForTone(h, t, { gamut })
          assert.ok(maxC > 0.02, `expected positive chroma at gamut=${gamut}, h=${h}, t=${t}`)
          assert.equal(
            isInGamut({ h, c: maxC * 0.999, t }, { gamut }).inGamut,
            true,
            `just inside should pass at ${gamut} h=${h} t=${t}`,
          )
          assert.equal(
            isInGamut({ h, c: maxC + 0.005, t }, { gamut }).inGamut,
            false,
            `just outside should fail at ${gamut} h=${h} t=${t}`,
          )
        }
      }
    }
  })

  it('yields equal or wider chroma in display-p3 than srgb and defaults to srgb', () => {
    assert.equal(findMaxChromaForTone(145, 60), findMaxChromaForTone(145, 60, { gamut: 'srgb' }))
    assert.ok(
      findMaxChromaForTone(145, 60, { gamut: 'display-p3' }) >
      findMaxChromaForTone(145, 60, { gamut: 'srgb' }),
    )
  })

  it('throws on invalid gamut target or invalid hue/tone coordinates', () => {
    assert.throws(
      () => findMaxChromaForTone(200, 50, { gamut: 'prophoto' as GamutTarget }),
      /Invalid gamut target/,
    )
    assert.throws(() => findMaxChromaForTone(Number.NaN, 50), /Invalid hue\/tone coordinates/)
    assert.throws(() => findMaxChromaForTone(200, Number.POSITIVE_INFINITY), /Invalid hue\/tone coordinates/)
    assert.throws(() => findMaxChromaForTone(200, -1), /Invalid hue\/tone coordinates/)
    assert.throws(() => findMaxChromaForTone(200, 101), /Invalid hue\/tone coordinates/)
  })
})
