import test from 'node:test'
import assert from 'node:assert/strict'
import type { ColorLayer, CompositedResult, StackOptions } from './layer-stacking.port.ts'

test('layer-stacking port types define layer, options, and composited result', () => {
  const layer: ColorLayer = {
    color: '#2563EB',
    opacity: 0.08,
    label: 'hover',
  }
  const options: StackOptions = {
    blendSpace: 'okyct',
  }
  const result: CompositedResult = {
    hex: '#2563EB',
    rgb: { r: 37, g: 99, b: 235 },
    okyct: { h: 263, c: 0.2, t: 40 },
    steps: [],
  }
  assert.equal(layer.opacity, 0.08)
  assert.equal(options.blendSpace, 'okyct')
  assert.equal(result.hex, '#2563EB')
})
