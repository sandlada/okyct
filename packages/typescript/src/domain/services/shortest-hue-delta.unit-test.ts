import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { shortestHueDelta } from './shortest-hue-delta.ts'

describe('shortestHueDelta', () => {
  it('returns 0 for identical hues and direct difference below 180 degrees', () => {
    assert.equal(shortestHueDelta(0, 0), 0)
    assert.equal(shortestHueDelta(250, 250), 0)
    assert.equal(shortestHueDelta(30, 120), 90)
    assert.equal(shortestHueDelta(120, 30), 90)
  })

  it('wraps cleanly across the 0/360 discontinuity and handles antipodal 180 degrees', () => {
    assert.equal(shortestHueDelta(10, 350), 20)
    assert.equal(shortestHueDelta(350, 10), 20)
    assert.ok(Math.abs(shortestHueDelta(359.5, 0.5) - 1) < 1e-9)
    assert.equal(shortestHueDelta(0, 180), 180)
    assert.equal(shortestHueDelta(90, 270), 180)
  })

  it('handles negative and multi-turn hue angles cleanly', () => {
    assert.equal(shortestHueDelta(725, 5), 0)
    assert.equal(shortestHueDelta(-20, 340), 0)
    assert.equal(shortestHueDelta(-10, 10), 20)
  })

  it('throws on non-finite hue inputs', () => {
    assert.throws(() => shortestHueDelta(Number.NaN, 90), /Invalid hue values/)
    assert.throws(() => shortestHueDelta(90, Number.POSITIVE_INFINITY), /Invalid hue values/)
    assert.throws(() => shortestHueDelta(Number.NEGATIVE_INFINITY, 0), /Invalid hue values/)
  })
})
