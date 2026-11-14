import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDynamicSchemeWithPhysics } from './build-dynamic-scheme-with-physics.ts'
import { createPalettesFromSource } from './create-palettes-from-source.ts'
import { resolveSchemeStateLayers } from './resolve-scheme-state-layers.ts'

test('resolveSchemeStateLayers generates requested state tokens and rejects invalid scheme', () => {
  const palettes = createPalettesFromSource('#2563EB')
  const scheme = buildDynamicSchemeWithPhysics(palettes, { mode: 'light' })
  const states = resolveSchemeStateLayers(scheme, ['hovered', 'pressed'], {
    blendSpace: 'okyct',
    contrastGuard: true,
  })
  assert.match(states.primaryHovered ?? '', /^#[0-9a-f]{6}$/i)
  assert.match(states.onPrimaryHovered ?? '', /^#[0-9a-f]{6}$/i)
  assert.equal(states.primaryDragged, undefined)

  assert.throws(() => resolveSchemeStateLayers(null as never, true), /Invalid scheme/)
})
