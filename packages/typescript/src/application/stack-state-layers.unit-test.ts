import test from 'node:test'
import assert from 'node:assert/strict'
import { stackStateLayers } from './stack-state-layers.ts'

test('stackStateLayers composites named MD3 interaction states over base hex', () => {
  const res = stackStateLayers(['hover', 'focus'])({
    base: '#2563EB',
    stateColor: '#FFFFFF',
  })
  assert.match(res.finalHex, /^#[0-9a-f]{6}$/i)
  assert.equal(res.traces.length, 3)
})
