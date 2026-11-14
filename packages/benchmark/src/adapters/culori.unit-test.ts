import test from 'node:test'
import assert from 'node:assert/strict'
import { generateCuloriFairStops } from './culori.ts'

test('generateCuloriFairStops produces tonal stops matching requested tones', () => {
  const stops = generateCuloriFairStops('#2563EB', [20, 40, 80])
  assert.equal(stops.length, 3)
  assert.equal(stops[0].targetLStar, 20)
  assert.match(stops[1].hex, /^#[0-9a-f]{6}$/i)
})
