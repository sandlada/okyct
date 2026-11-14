import test from 'node:test'
import assert from 'node:assert/strict'
import { auditSchemeCvd } from './audit-scheme-cvd.ts'
import { buildDynamicSchemeWithPhysics } from './build-dynamic-scheme-with-physics.ts'
import { createPalettesFromSource } from './create-palettes-from-source.ts'

test('auditSchemeCvd returns separability items for protanopia, deuteranopia, tritanopia', () => {
  const palettes = createPalettesFromSource('#2563EB')
  const scheme = buildDynamicSchemeWithPhysics(palettes, { mode: 'light' })
  const report = auditSchemeCvd(scheme)
  assert.ok(report.length > 0)
  assert.ok(report.some((r) => r.cvdType === 'deuteranopia'))
})
