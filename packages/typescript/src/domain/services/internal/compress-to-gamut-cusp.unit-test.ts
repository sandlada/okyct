import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { linearToSrgb } from '../linear-to-srgb.ts'
import { rgbToOkyct } from '../rgb-to-okyct.ts'
import { shortestHueDelta } from '../shortest-hue-delta.ts'
import { compressToGamutCusp } from './compress-to-gamut-cusp.ts'

describe('compressToGamutCusp', () => {
  it('compresses dark, mid, and light out-of-gamut colors into [0, 1] linear RGB for srgb and display-p3', () => {
    for (const gamut of ['srgb', 'display-p3'] as const) {
      for (const t of [15, 50, 85]) {
        for (const h of [29, 145, 264]) {
          const linear = compressToGamutCusp(h, 0.45, t, gamut)
          assert.ok(linear.r >= -1e-4 && linear.r <= 1.0001)
          assert.ok(linear.g >= -1e-4 && linear.g <= 1.0001)
          assert.ok(linear.b >= -1e-4 && linear.b <= 1.0001)
        }
      }
    }
  })

  it('preserves hue angle with zero perceptible rotation after compression in srgb', () => {
    const linear = compressToGamutCusp(145, 0.45, 75, 'srgb')
    const okyct = rgbToOkyct({
      r: Math.max(0, Math.min(1, linearToSrgb(linear.r))),
      g: Math.max(0, Math.min(1, linearToSrgb(linear.g))),
      b: Math.max(0, Math.min(1, linearToSrgb(linear.b))),
    })
    assert.ok(okyct.c > 0.05)
    assert.ok(shortestHueDelta(okyct.h, 145) < 0.5)
  })
})
