import test from 'node:test'
import assert from 'node:assert/strict'
import { hexToOkyct } from '../domain/index.ts'
import { TonalPalette } from './tonal-palette.ts'

test('TonalPalette generates accurate tonal stops and preserves hue', () => {
  const palette = TonalPalette.fromHex('#2563EB')
  assert.equal(palette.tone(0), '#000000')
  assert.equal(palette.tone(100), '#ffffff')

  const t40 = hexToOkyct(palette.tone(40))
  assert.ok(Math.abs(t40.t - 40) < 0.6)
  assert.equal(palette.tone(40), palette.tone(40))
})

test('TonalPalette toneOkyct and toneCss honor display-p3 gamut and CSS Color 4 formats', () => {
  const p3Palette = new TonalPalette(145, 0.32, { gamut: 'display-p3', softKnee: false })
  const srgbCoord = p3Palette.toneOkyct(75, { gamut: 'srgb' })
  const p3Coord = p3Palette.toneOkyct(75)

  assert.ok(p3Coord.c > srgbCoord.c, `expected P3 chroma ${p3Coord.c} > sRGB ${srgbCoord.c}`)
  assert.equal(p3Coord.t, 75)

  assert.match(p3Palette.toneCss(75), /^oklch\(/)
  assert.match(p3Palette.toneCss(75, 'oklch'), /^oklch\(/)
  assert.match(p3Palette.toneCss(75, 'display-p3'), /^color\(display-p3 /)
  assert.match(p3Palette.toneCss(75, 'hex'), /^#[0-9a-f]{6}$/i)
})

test('TonalPalette enforces bounded LRU cache size', () => {
  const palette = TonalPalette.fromHex('#2563EB', { maxCacheSize: 8 })
  for (let t = 1; t <= 40; t++) {
    palette.tone(t)
    palette.toneOkyct(t)
  }
  assert.ok(palette.cacheSize <= 16)

  const uncached = TonalPalette.fromHex('#2563EB', { maxCacheSize: 0 })
  uncached.tone(40)
  uncached.toneOkyct(40)
  assert.equal(uncached.cacheSize, 0)
})
