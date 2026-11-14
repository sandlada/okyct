import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeEmissiveSchemeMetrics } from './analyze-emissive-scheme-metrics.ts'
import { buildDynamicScheme } from './build-dynamic-scheme.ts'

test('analyzeEmissiveSchemeMetrics computes power and burn-in metrics for a scheme', () => {
  const scheme = buildDynamicScheme('#2563EB', {
    variant: 'tonalSpot',
    mode: 'dark',
    emissive: { profile: 'amoled-anti-smear' },
  })
  const report = analyzeEmissiveSchemeMetrics(scheme, 'amoled-anti-smear')
  assert.equal(report.profile, 'amoled-anti-smear')
  assert.ok(report.estimatedTotalPowerMw >= 0)
  assert.ok(report.powerSavingsVsLcdPct >= 0)
})
