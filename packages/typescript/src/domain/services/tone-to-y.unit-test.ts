import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from './tone-to-y.ts'

describe('toneToY', () => {
  it('maps endpoints 0 and 100 to exact luminance 0 and 1', () => {
    assert.equal(toneToY(0), 0)
    assert.equal(toneToY(100), 1)
  })

  it('handles piecewise linear (<= 8) and cubic (> 8) segments with continuity at Tone 8', () => {
    const cieKappa = 24389.0 / 27.0
    assert.ok(Math.abs(toneToY(4) - 4 / cieKappa) < 1e-12)
    assert.ok(Math.abs(toneToY(8) - 8 / cieKappa) < 1e-12)

    const cubicAt8 = Math.pow((8 + 16) / 116, 3)
    assert.ok(Math.abs(toneToY(8) - cubicAt8) < 1e-10)
    assert.ok(Math.abs(toneToY(50) - Math.pow((50 + 16) / 116, 3)) < 1e-12)
  })

  it('clamps out-of-range tones into [0, 100] and is strictly monotonic', () => {
    assert.equal(toneToY(-10), 0)
    assert.equal(toneToY(150), 1)

    let prev = -1
    for (let t = 0; t <= 100; t += 2) {
      const y = toneToY(t)
      assert.ok(y > prev)
      prev = y
    }
  })

  it('throws on non-finite tone inputs', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.throws(() => toneToY(bad), /Invalid tone value/)
    }
  })
})
