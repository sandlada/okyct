import test from 'node:test'
import assert from 'node:assert/strict'
import { okyctToRgb } from '../../domain/index.ts'
import { extractSeedsFromImageData } from './extract-seeds-from-image-data.ts'

test('extractSeedsFromImageData ranks dominant chromatic seeds and ignores transparent pixels', () => {
  const data = new Uint8ClampedArray([
    37, 99, 235, 255,
    37, 99, 235, 255,
    255, 0, 0, 0,
  ])
  const seeds = extractSeedsFromImageData({ width: 3, height: 1, data }, { maxColors: 3 })
  assert.ok(seeds.length >= 1)
  assert.ok(seeds[0].salienceScore > 0)
  assert.ok(seeds[0].populationRatio > 0)
})

test('extractSeedsFromImageData default hue-tone-grid separates dark and light clusters of the same hue', () => {
  const darkBlue = okyctToRgb({ h: 255, c: 0.14, t: 25 })
  const lightBlue = okyctToRgb({ h: 255, c: 0.12, t: 75 })
  const pixels: number[] = []
  for (let i = 0; i < 40; i++) {
    pixels.push(
      Math.round(darkBlue.r * 255),
      Math.round(darkBlue.g * 255),
      Math.round(darkBlue.b * 255),
      255
    )
  }
  for (let i = 0; i < 40; i++) {
    pixels.push(
      Math.round(lightBlue.r * 255),
      Math.round(lightBlue.g * 255),
      Math.round(lightBlue.b * 255),
      255
    )
  }

  const gridSeeds = extractSeedsFromImageData(
    { width: 80, height: 1, data: new Uint8ClampedArray(pixels) },
    { maxColors: 4, mode: 'hue-tone-grid' }
  )
  assert.equal(gridSeeds.length, 2, `expected 2 same-hue distinct-tone seeds, got ${gridSeeds.length}`)
  const toneGap = Math.abs(gridSeeds[0].okyct.t - gridSeeds[1].okyct.t)
  assert.ok(toneGap >= 22, `expected distinct tones, got gap=${toneGap}`)

  const histSeeds = extractSeedsFromImageData(
    { width: 80, height: 1, data: new Uint8ClampedArray(pixels) },
    { maxColors: 4, mode: 'hue-histogram' }
  )
  assert.equal(histSeeds.length, 1)
})
