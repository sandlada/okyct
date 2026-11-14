import test from 'node:test'
import assert from 'node:assert/strict'
import { toneToY } from '../tone-to-y.ts'
import { evalLinearGamutMargin } from './eval-linear-gamut-margin.ts'

test('evalLinearGamutMargin returns positive margin inside gamut and negative outside', () => {
  const inside = evalLinearGamutMargin(toneToY(50), 0, 0, 'srgb')
  assert.ok(inside.margin > 0)

  const outside = evalLinearGamutMargin(toneToY(50), -0.4, 0.4, 'srgb')
  assert.ok(outside.margin < 0)
})
