import test from 'node:test'
import assert from 'node:assert/strict'
import { optimizeForOled } from './optimize-for-oled.ts'

test('optimizeForOled applies emissive profile to token dictionary', () => {
  const out = optimizeForOled({ profile: 'micro-oled-xr' })({
    onSurface: '#FFFFFF',
    surface: '#000000',
  })
  assert.match(out.onSurface, /^#[0-9a-f]{6}$/i)
  assert.notEqual(out.onSurface, '#FFFFFF')
})
