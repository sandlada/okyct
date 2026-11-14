import test from 'node:test'
import assert from 'node:assert/strict'
import { generateMcuFairStops } from './mcu.ts'

test('generateMcuFairStops produces MCU tonal stops matching requested tones', () => {
  const stops = generateMcuFairStops('#2563EB', [20, 40, 80])
  assert.equal(stops.length, 3)
  assert.equal(stops[1].targetLStar, 40)
  assert.match(stops[2].hex, /^#[0-9a-f]{6}$/i)
})
