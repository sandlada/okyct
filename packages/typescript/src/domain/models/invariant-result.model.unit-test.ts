import test from 'node:test'
import assert from 'node:assert/strict'
import type { InvariantTestResult } from './invariant-result.model.ts'

test('InvariantTestResult captures pass/fail telemetry', () => {
  const entry: InvariantTestResult = {
    id: 'roundtrip',
    name: 'sRGB Roundtrip',
    formula: 'sRGB -> OKYCT -> sRGB',
    passed: true,
    measuredValue: '0.0000',
    threshold: '< 1e-4',
    samplesChecked: 100,
    details: 'ok',
  }
  assert.equal(entry.passed, true)
  assert.equal(entry.samplesChecked, 100)
})
