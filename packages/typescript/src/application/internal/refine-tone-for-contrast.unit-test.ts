import test from 'node:test'
import assert from 'node:assert/strict'
import { getContrastRatio } from '../../domain/index.ts'
import { TonalPalette } from '../tonal-palette.ts'
import { refineToneForContrast } from './refine-tone-for-contrast.ts'

test('refineToneForContrast returns immediately when startTone already passes', () => {
  const palette = TonalPalette.fromHex('#2563EB')
  let calls = 0
  const result = refineToneForContrast({
    startTone: 95,
    limitTone: 100,
    resolveHex: (t) => {
      calls++
      return palette.tone(t)
    },
    passes: (hex) => getContrastRatio(hex, '#10141C') >= 4.5,
  })
  assert.equal(result.passed, true)
  assert.equal(result.tone, 95)
  assert.equal(calls, 1)
})

test('refineToneForContrast fails fast in 2 evaluations when limitTone cannot pass', () => {
  const palette = TonalPalette.fromHex('#2563EB')
  let calls = 0
  const result = refineToneForContrast({
    startTone: 45,
    limitTone: 55,
    resolveHex: (t) => {
      calls++
      return palette.tone(t)
    },
    passes: (hex) => getContrastRatio(hex, '#808080') >= 7.0,
  })
  assert.equal(result.passed, false)
  assert.equal(result.tone, 55)
  assert.equal(calls, 2)
})

test('refineToneForContrast converges within 0.05 Tone without overshooting', () => {
  const palette = TonalPalette.fromHex('#2563EB')
  const bgHex = palette.tone(20)
  const result = refineToneForContrast({
    startTone: 40,
    limitTone: 100,
    resolveHex: (t) => palette.tone(t),
    passes: (hex) => getContrastRatio(hex, bgHex) >= 4.5,
    tolerance: 0.05,
  })
  assert.equal(result.passed, true)
  assert.ok(getContrastRatio(result.hex, bgHex) >= 4.5)
  const slightlyLower = palette.tone(Math.max(40, result.tone - 0.1))
  assert.ok(getContrastRatio(slightlyLower, bgHex) < 4.55)
})
