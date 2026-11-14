import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDynamicScheme } from './build-dynamic-scheme.ts'

test('buildDynamicScheme builds light and dark schemes with optional stateLayers', () => {
  const a = buildDynamicScheme('#2563EB', { variant: 'tonalSpot', mode: 'light' })
  const b = buildDynamicScheme('#2563EB', { variant: 'vibrant', mode: 'dark', stateLayers: true })

  assert.match(a.primary, /^#[0-9a-f]{6}$/i)
  assert.match(b.primary, /^#[0-9a-f]{6}$/i)
  assert.ok(b.stateLayers?.primaryHovered)
})
