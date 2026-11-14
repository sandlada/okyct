import test from 'node:test'
import assert from 'node:assert/strict'
import { auditSchemeContrast } from './audit-scheme-contrast.ts'
import { buildDynamicSchemeWithPhysics } from './build-dynamic-scheme-with-physics.ts'
import { createPalettesFromSource } from './create-palettes-from-source.ts'

test('auditSchemeContrast verifies all foreground/background pairs pass WCAG AA', () => {
  const palettes = createPalettesFromSource('#2563EB')
  const scheme = buildDynamicSchemeWithPhysics(palettes, { mode: 'light' })
  const items = auditSchemeContrast(scheme)
  assert.ok(items.length > 0)
  for (const item of items) {
    assert.equal(item.wcagPassAA, true, `${item.fgRole}/${item.bgRole} failed AA: ${item.wcagRatio}`)
  }
})
