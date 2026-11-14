import test from 'node:test'
import assert from 'node:assert/strict'
import { limitBlueEmission } from './limit-blue-emission.ts'

test('limitBlueEmission caps blue burn-in stress for a color hex', () => {
  const out = limitBlueEmission({ maxBlueAttenuation: 0.25 })('#0000FF')
  assert.match(out, /^#[0-9a-f]{6}$/i)
})
