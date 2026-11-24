import test from 'node:test'
import assert from 'node:assert/strict'
import { auditOledPower } from './audit-oled-power.ts'

test('auditOledPower separates trueBlackTokenCount (#000000) from nearBlackTokenCount (#010101) and skips non-ASCII whitespace', () => {
  const report = auditOledPower({ maxAvgPowerMw: 800, maxBlueStress: 100 })({
    surface: '#000000',
    nearBlack: '#010101',
    primary: '#0000FF',
    onPrimary: '#FFFFFF',
    nelPrefixed: '\u0085#000000',
    bomPrefixed: '\uFEFF#000000',
  })
  assert.equal(report.totalTokensEvaluated, 4)
  assert.equal(report.trueBlackTokenCount, 1)
  assert.equal(report.nearBlackTokenCount, 1)
  assert.ok(report.averagePowerMw > 0)
  assert.equal(report.passed, true)
})
