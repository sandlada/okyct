import test from 'node:test'
import assert from 'node:assert/strict'
import { stackLayers } from './stacker.ts'

test('color/stacker facade re-exports stackLayers', () => {
  const res = stackLayers()([{ color: '#FFFFFF', opacity: 0.08 }])('#2563EB')
  assert.match(res.finalHex, /^#[0-9a-f]{6}$/i)
})
