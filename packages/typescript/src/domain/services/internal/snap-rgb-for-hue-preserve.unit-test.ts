import test from 'node:test'
import assert from 'node:assert/strict'
import { snapRgbToHexForHuePreserve } from './snap-rgb-for-hue-preserve.ts'

test('snapRgbToHexForHuePreserve handles black, white, and chromatic snapping', () => {
  assert.equal(snapRgbToHexForHuePreserve({ r: 0, g: 0, b: 0 }, 0, 0), '#000000')
  assert.equal(snapRgbToHexForHuePreserve({ r: 1, g: 1, b: 1 }, 0, 100), '#ffffff')

  const hex = snapRgbToHexForHuePreserve({ r: 0.145, g: 0.388, b: 0.922 }, 263, 45, 0.18)
  assert.match(hex, /^#[0-9a-f]{6}$/i)
})
