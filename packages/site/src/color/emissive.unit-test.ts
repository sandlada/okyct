import test from 'node:test'
import assert from 'node:assert/strict'
import { EmissivePanelSpecs, computeColorEmissiveTelemetry } from './emissive.ts'

test('color/emissive facade re-exports emissive panel specs and telemetry', () => {
  assert.ok(EmissivePanelSpecs['oled-true-black'])
  assert.equal(computeColorEmissiveTelemetry('#000000').powerMw, 0)
})
