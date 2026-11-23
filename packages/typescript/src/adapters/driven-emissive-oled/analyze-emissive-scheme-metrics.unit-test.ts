import test from 'node:test'
import assert from 'node:assert/strict'
import { auditSchemeContrast } from '../../application/index.ts'
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

test('analyzeEmissiveSchemeMetrics reports true minimum text WCAG contrast across all audited pairs', () => {
  for (const mode of ['light', 'dark'] as const) {
    for (const profile of ['standard-lcd', 'oled-true-black', 'amoled-anti-smear', 'micro-oled-xr'] as const) {
      const scheme = buildDynamicScheme('#2563EB', {
        mode,
        emissive: {
          profile,
          burnInGuard: true,
          antiFringing: true,
          ablGuard: true,
        },
      })
      const report = analyzeEmissiveSchemeMetrics(scheme, profile)
      const textAudits = auditSchemeContrast(scheme).filter((item) => item.fgRole !== 'outline')
      const expectedMin = textAudits.reduce((min, item) => (item.wcagRatio < min.wcagRatio ? item : min))

      assert.equal(report.minWcagContrastAfterOpt, expectedMin.wcagRatio)
      assert.deepEqual(report.minWcagContrastPair, {
        fgRole: expectedMin.fgRole,
        bgRole: expectedMin.bgRole,
      })
    }
  }
})
