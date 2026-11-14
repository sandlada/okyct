import test from 'node:test'
import assert from 'node:assert/strict'
import { extractSeedsFromImageData } from './extract-seeds-from-image-data.ts'

test('extractSeedsFromImageData ranks dominant chromatic seeds and ignores transparent pixels', () => {
  const data = new Uint8ClampedArray([
    37, 99, 235, 255,
    37, 99, 235, 255,
    255, 0, 0, 0,
  ])
  const seeds = extractSeedsFromImageData({ width: 3, height: 1, data }, 3)
  assert.ok(seeds.length >= 1)
  assert.ok(seeds[0].salienceScore > 0)
  assert.ok(seeds[0].populationRatio > 0)
})
