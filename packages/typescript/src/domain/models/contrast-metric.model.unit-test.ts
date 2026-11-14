import test from 'node:test'
import assert from 'node:assert/strict'
import { ContrastMetrics, type ContrastMetric } from './contrast-metric.model.ts'

test('ContrastMetrics contains wcag, apca, and both', () => {
  assert.deepEqual(ContrastMetrics, ['wcag', 'apca', 'both'])
  const metric: ContrastMetric = ContrastMetrics[0]
  assert.equal(metric, 'wcag')
})
