import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { oklabToOklch } from './oklab-to-oklch.ts'
import { oklchToOklab } from './oklch-to-oklab.ts'

describe('oklchToOklab', () => {
  it('converts polar OKLCH back to Cartesian OKLab and roundtrips across hues', () => {
    const axis = oklchToOklab({ L: 0.5, C: 0.2, h: 180 })
    assert.equal(axis.L, 0.5)
    assert.ok(Math.abs(axis.a - (-0.2)) < 1e-9)
    assert.ok(Math.abs(axis.b) < 1e-9)

    for (const h of [15, 75, 145, 225, 315]) {
      const roundtrip = oklabToOklch(oklchToOklab({ L: 0.62, C: 0.12, h }))
      assert.ok(Math.abs(roundtrip.C - 0.12) < 1e-9)
      assert.ok(Math.abs(roundtrip.h - h) < 1e-9)
    }
  })
})
