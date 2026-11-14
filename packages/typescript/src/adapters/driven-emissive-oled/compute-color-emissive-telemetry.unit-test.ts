import test from 'node:test'
import assert from 'node:assert/strict'
import { computeColorEmissiveTelemetry } from './compute-color-emissive-telemetry.ts'

test('computeColorEmissiveTelemetry reports higher power for blue/white than black', () => {
  const black = computeColorEmissiveTelemetry('#000000')
  const blue = computeColorEmissiveTelemetry('#0000FF')
  const white = computeColorEmissiveTelemetry('#FFFFFF')

  assert.equal(black.powerMw, 0)
  assert.ok(white.powerMw > blue.powerMw)
  assert.ok(blue.blueStressIndex > 0)
})
