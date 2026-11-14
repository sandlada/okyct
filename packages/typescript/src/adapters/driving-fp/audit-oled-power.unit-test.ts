import test from 'node:test'
import assert from 'node:assert/strict'
import { auditOledPower } from './audit-oled-power.ts'

test('auditOledPower computes average power, APL, and blue stress metrics', () => {
  const report = auditOledPower({ maxAvgPowerMw: 800, maxBlueStress: 100 })({
    surface: '#000000',
    primary: '#0000FF',
    onPrimary: '#FFFFFF',
  })
  assert.equal(report.totalTokensEvaluated, 3)
  assert.equal(report.trueBlackTokenCount, 1)
  assert.ok(report.averagePowerMw > 0)
  assert.equal(report.passed, true)
})
