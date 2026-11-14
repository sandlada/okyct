import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from '../tone-to-y.ts'
import { evalLinearGamutMargin } from './eval-linear-gamut-margin.ts'

describe('evalLinearGamutMargin', () => {
  it('returns positive margin inside gamut and negative margin outside gamut for srgb and display-p3', () => {
    const y50 = toneToY(50)
    const neutral = evalLinearGamutMargin(y50, 0, 0, 'srgb')
    assert.ok(neutral.margin > 0.15)
    assert.ok(neutral.L > 0 && neutral.L < 1)

    const outsideSrgb = evalLinearGamutMargin(y50, -0.4, 0.4, 'srgb')
    assert.ok(outsideSrgb.margin < 0)

    const outsideP3 = evalLinearGamutMargin(y50, -0.4, 0.4, 'display-p3')
    assert.ok(outsideP3.margin > outsideSrgb.margin)
  })

  it('converges identically with an initialL warm start', () => {
    const y60 = toneToY(60)
    const cold = evalLinearGamutMargin(y60, 0.04, -0.09, 'srgb')
    const warm = evalLinearGamutMargin(y60, 0.04, -0.09, 'srgb', cold.L)
    assert.ok(Math.abs(warm.margin - cold.margin) < 1e-9)
    assert.ok(Math.abs(warm.linear.r - cold.linear.r) < 1e-9)
  })
})
