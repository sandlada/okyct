import test from 'node:test'
import assert from 'node:assert/strict'
import type { ExtractedSeedColor, ImagePixelBuffer } from './image-quantizer.port.ts'

test('image-quantizer port types define ImagePixelBuffer and ExtractedSeedColor', () => {
  const buffer: ImagePixelBuffer = {
    width: 1,
    height: 1,
    data: new Uint8ClampedArray([37, 99, 235, 255]),
  }
  const seed: ExtractedSeedColor = {
    hex: '#2563EB',
    okyct: { h: 263, c: 0.2, t: 40 },
    populationRatio: 1,
    salienceScore: 1,
  }
  assert.equal(buffer.data.length, 4)
  assert.equal(seed.hex, '#2563EB')
})
