import test from 'node:test'
import assert from 'node:assert/strict'
import { computeColorEmissiveTelemetry } from './compute-color-emissive-telemetry.ts'

test('computeColorEmissiveTelemetry distinguishes true black (#000000) from near-black (#010101) and active pixels', () => {
  const black = computeColorEmissiveTelemetry('#000000')
  const nearBlack = computeColorEmissiveTelemetry('#010101')
  const activeDark = computeColorEmissiveTelemetry('#020202')
  const blue = computeColorEmissiveTelemetry('#0000FF')
  const white = computeColorEmissiveTelemetry('#FFFFFF')

  assert.equal(black.isPixelOff, true)
  assert.equal(black.emitterState, 'off')
  assert.equal(black.powerMw, 0)

  assert.equal(nearBlack.isPixelOff, false)
  assert.equal(nearBlack.emitterState, 'near-black')
  assert.equal(nearBlack.powerMw, 0.2)

  assert.equal(activeDark.isPixelOff, false)
  assert.equal(activeDark.emitterState, 'active')
  assert.ok(activeDark.powerMw >= nearBlack.powerMw)

  assert.ok(white.powerMw > blue.powerMw)
  assert.ok(blue.blueStressIndex > 0)
})
