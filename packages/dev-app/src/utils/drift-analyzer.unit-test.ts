import test from 'node:test'
import assert from 'node:assert/strict'
import {
  StressPresets,
  analyzeRampHueDrift,
  scanSpectrumHueDrift,
} from './drift-analyzer.ts'

test('drift-analyzer analyzes ramp hue drift and scans spectrum', () => {
  assert.ok(StressPresets.length > 0)
  const ramp = analyzeRampHueDrift('#2563EB')
  assert.ok(ramp.stops.length > 0)
  const spectrum = scanSpectrumHueDrift()
  assert.ok(spectrum.length > 0)
})
