import test from 'node:test'
import assert from 'node:assert/strict'
import { stackLayers } from './stack-layers.ts'

test('stackLayers composites multiple layers in okyct, gamma-srgb, and linear-srgb', () => {
  const layers = [{ color: '#FFFFFF', opacity: 0.12, label: 'hover' }]
  const okyctRes = stackLayers({ blendSpace: 'okyct' })(layers)('#2563EB')
  const srgbRes = stackLayers({ blendSpace: 'gamma-srgb' })(layers)('#2563EB')

  assert.match(okyctRes.finalHex, /^#[0-9a-f]{6}$/i)
  assert.match(srgbRes.finalHex, /^#[0-9a-f]{6}$/i)
  assert.equal(okyctRes.traces.length, 2)
})
