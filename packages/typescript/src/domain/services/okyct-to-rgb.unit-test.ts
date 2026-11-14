import test from 'node:test'
import assert from 'node:assert/strict'
import { okyctToRgb } from './okyct-to-rgb.ts'

test('okyctToRgb clamps normalized channels into [0, 1] for extreme chroma', () => {
  const rgb = okyctToRgb({ h: 250, c: 0.5, t: 50 })
  assert.ok(rgb.r >= 0 && rgb.r <= 1)
  assert.ok(rgb.g >= 0 && rgb.g <= 1)
  assert.ok(rgb.b >= 0 && rgb.b <= 1)

  const cuspRgb = okyctToRgb({ h: 250, c: 0.5, t: 50 }, { gamutMapping: 'cusp-compress' })
  assert.ok(cuspRgb.r >= 0 && cuspRgb.r <= 1)
})
