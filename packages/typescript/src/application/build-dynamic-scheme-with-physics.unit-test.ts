import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDynamicSchemeWithPhysics } from './build-dynamic-scheme-with-physics.ts'
import { createPalettesFromSource } from './create-palettes-from-source.ts'

test('buildDynamicSchemeWithPhysics builds light and dark schemes with optional state layers', () => {
  const palettes = createPalettesFromSource('#2563EB')
  const light = buildDynamicSchemeWithPhysics(palettes, { mode: 'light', stateLayers: ['hovered'] })
  const dark = buildDynamicSchemeWithPhysics(palettes, { mode: 'dark' })

  assert.match(light.primary, /^#[0-9a-f]{6}$/i)
  assert.match(dark.surface, /^#[0-9a-f]{6}$/i)
  assert.ok(light.stateLayers?.primaryHovered)
  assert.notEqual(light.surface, dark.surface)
})
