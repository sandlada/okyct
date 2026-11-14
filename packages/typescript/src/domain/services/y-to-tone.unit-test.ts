import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from './tone-to-y.ts'
import { yToTone } from './y-to-tone.ts'

describe('yToTone', () => {
  it('maps luminance endpoints 0 and 1 to Tone 0 and 100', () => {
    assert.equal(yToTone(0), 0)
    assert.equal(yToTone(1), 100)
  })

  it('evaluates linear and cube-root CIE L* branches continuously at CIE epsilon', () => {
    const cieEpsilon = 216.0 / 24389.0
    const cieKappa = 24389.0 / 27.0
    assert.ok(Math.abs(yToTone(0.004) - 0.004 * cieKappa) < 1e-12)
    assert.ok(Math.abs(yToTone(cieEpsilon) - 8) < 1e-9)
    assert.ok(Math.abs(yToTone(cieEpsilon + 1e-7) - 8) < 1e-4)
  })

  it('clamps out-of-range luminance values into [0, 100]', () => {
    assert.equal(yToTone(-0.5), 0)
    assert.equal(yToTone(1.5), 100)
  })

  it('forms an exact bijection with toneToY across [0, 100]', () => {
    for (let t = 0; t <= 100; t += 2.5) {
      const roundtrip = yToTone(toneToY(t))
      assert.ok(Math.abs(roundtrip - t) < 1e-9, `failed at t=${t}`)
    }
    for (let i = 0; i <= 20; i++) {
      const y = i / 20
      const roundtripY = toneToY(yToTone(y))
      assert.ok(Math.abs(roundtripY - y) < 1e-9, `failed at y=${y}`)
    }
  })

  it('throws on non-finite relative luminance Y inputs', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.throws(() => yToTone(bad), /Invalid relative luminance Y/)
    }
  })
})
