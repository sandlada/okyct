import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EmissivePanelSpecs,
  analyzeEmissiveSchemeMetrics,
  applyBlueBurnInGuard,
  buildDynamicScheme,
  computeColorEmissiveTelemetry,
} from './index.ts'

test('driven-emissive-oled barrel exports panel specs, telemetry, and scheme builders', () => {
  assert.equal(EmissivePanelSpecs['oled-true-black'].darkSurfaceTones.surface, 0)
  assert.ok(computeColorEmissiveTelemetry('#2563EB').powerMw >= 0)
  assert.match(applyBlueBurnInGuard('#2563EB'), /^#[0-9a-f]{6}$/i)
  const scheme = buildDynamicScheme('#2563EB', { variant: 'tonalSpot', mode: 'dark' })
  assert.ok(analyzeEmissiveSchemeMetrics(scheme, 'oled-true-black').estimatedTotalPowerMw >= 0)
})
