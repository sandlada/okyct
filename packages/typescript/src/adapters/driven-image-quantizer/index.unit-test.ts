import test from 'node:test'
import assert from 'node:assert/strict'
import { extractSeedsFromImageData } from './index.ts'

test('driven-image-quantizer barrel exports extractSeedsFromImageData', () => {
  const data = new Uint8ClampedArray([
    37, 99, 235, 255,
    37, 99, 235, 255,
    16, 185, 129, 255,
  ])
  const seeds = extractSeedsFromImageData({ width: 3, height: 1, data }, 2)
  assert.ok(seeds.length >= 1)
  assert.match(seeds[0].hex, /^#[0-9a-f]{6}$/i)
})
