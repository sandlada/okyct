import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isInGamut } from './is-in-gamut.ts'
import { isInSrgbGamut } from './is-in-srgb-gamut.ts'

describe('isInSrgbGamut', () => {
  it('supports both OKYCT object and positional (h, c, t) overloads consistently', () => {
    const samples = [
      { h: 0, c: 0, t: 50 },
      { h: 250, c: 0.08, t: 45 },
      { h: 145, c: 0.45, t: 60 },
      { h: 30, c: 0, t: 0 },
      { h: 30, c: 0, t: 100 },
    ]
    for (const color of samples) {
      const fromObj = isInSrgbGamut(color)
      const fromArgs = isInSrgbGamut(color.h, color.c, color.t)
      const direct = isInGamut(color, { gamut: 'srgb' })
      assert.deepEqual(fromObj, direct)
      assert.deepEqual(fromArgs, direct)
    }
  })

  it('throws on invalid positional numeric arguments', () => {
    assert.throws(() => isInSrgbGamut(0, -0.1, 50), /Invalid OKYCT coordinates/)
    assert.throws(() => isInSrgbGamut(0, 0.1, 105), /Invalid OKYCT coordinates/)
    assert.throws(() => isInSrgbGamut(Number.NaN, 0.1, 50), /Invalid OKYCT coordinates/)
  })
})
