import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { oklabToOklch } from './oklab-to-oklch.ts'

describe('oklabToOklch', () => {
  it('snaps near-zero chroma (including -0 components) to exact C=0 and h=0', () => {
    assert.deepEqual(oklabToOklch({ L: 0.5, a: 0, b: 0 }), { L: 0.5, C: 0, h: 0 })
    assert.deepEqual(oklabToOklch({ L: 0.5, a: 0, b: -0 }), { L: 0.5, C: 0, h: 0 })
    assert.deepEqual(oklabToOklch({ L: 0.5, a: -1e-8, b: 2e-8 }), { L: 0.5, C: 0, h: 0 })
  })

  it('converts Cartesian OKLab into polar OKLCH across all four quadrants', () => {
    const q1 = oklabToOklch({ L: 0.6, a: 0, b: 0.1 })
    assert.equal(q1.L, 0.6)
    assert.ok(Math.abs(q1.C - 0.1) < 1e-9)
    assert.ok(Math.abs(q1.h - 90) < 1e-9)

    const q3 = oklabToOklch({ L: 0.5, a: -0.1, b: -0.1 })
    assert.ok(Math.abs(q3.C - Math.SQRT2 * 0.1) < 1e-9)
    assert.ok(Math.abs(q3.h - 225) < 1e-9)

    const q4 = oklabToOklch({ L: 0.5, a: 0.1, b: -0.1 })
    assert.ok(Math.abs(q4.h - 315) < 1e-9)
  })
})
