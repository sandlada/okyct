import test from 'node:test'
import assert from 'node:assert/strict'
import { auditStackedContrast } from './audit-stacked-contrast.ts'
import { stackLayers } from './stack-layers.ts'

test('auditStackedContrast evaluates WCAG & APCA contrast against stacked background', () => {
  const composited = stackLayers()([{ color: '#000000', opacity: 0.08 }])('#FFFFFF')
  const report = auditStackedContrast('#111827')(composited)
  assert.ok(report.wcagRatio > 10)
  assert.equal(report.wcagPassAA, true)
  assert.equal(report.wcagPassAAA, true)
})
