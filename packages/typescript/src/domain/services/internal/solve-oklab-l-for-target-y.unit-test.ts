import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { oklabToXyz } from './oklab-to-xyz.ts'
import { solveOklabLForTargetY } from './solve-oklab-l-for-target-y.ts'

describe('solveOklabLForTargetY', () => {
  it('returns boundary L values 0 and 1 at targetY <= 0 and targetY >= 1', () => {
    assert.equal(solveOklabLForTargetY(0, 0, 0), 0)
    assert.equal(solveOklabLForTargetY(-0.1, 0.05, -0.05), 0)
    assert.equal(solveOklabLForTargetY(1, 0, 0), 1)
    assert.equal(solveOklabLForTargetY(1.2, 0.05, -0.05), 1)
  })

  it('converges within 1e-9 using Halley 3rd-order solver across varied (a, b) and targetY', () => {
    const cases = [
      { y: 0.01, a: 0.02, b: -0.04 },
      { y: 0.18, a: 0.12, b: 0.06 },
      { y: 0.25, a: 0.04, b: -0.08 },
      { y: 0.72, a: -0.1, b: 0.11 },
    ]
    for (const c of cases) {
      const l = solveOklabLForTargetY(c.y, c.a, c.b)
      const xyz = oklabToXyz({ L: l, a: c.a, b: c.b })
      assert.ok(Math.abs(xyz.y - c.y) < 1e-9, `failed for y=${c.y}, got ${xyz.y}`)
    }
  })

  it('supports warm-start initialL parameter and produces matching convergence', () => {
    const cold = solveOklabLForTargetY(0.3, -0.05, 0.09)
    const warm = solveOklabLForTargetY(0.3, -0.05, 0.09, cold + 0.01)
    assert.ok(Math.abs(warm - cold) < 1e-9)
  })
})
