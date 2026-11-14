import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAbsoluteHueGradient,
  measureHueSeedPerformance,
} from './seedPerf.ts'

describe('landing/seedPerf', () => {
  it('measures hue/hex solve performance and builds gradient CSS', () => {
    const perf = measureHueSeedPerformance(215)
    assert.match(perf.hex, /^#[0-9a-f]{6}$/i)
    assert.ok(perf.solveMs >= 0)
    const css = buildAbsoluteHueGradient()
    assert.ok(css.includes('linear-gradient'))
  })
})
