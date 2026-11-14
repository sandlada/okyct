import test from 'node:test'
import assert from 'node:assert/strict'
import { applySubpixelEdgeCompensation } from './apply-subpixel-edge-compensation.ts'

test('applySubpixelEdgeCompensation damps extreme saturation on amoled-anti-smear and caps XR highlights', () => {
  const amoled = applySubpixelEdgeCompensation('#0000FF', 'amoled-anti-smear', 'accent')
  const xr = applySubpixelEdgeCompensation('#FFFFFF', 'micro-oled-xr', 'foreground')

  assert.match(amoled, /^#[0-9a-f]{6}$/i)
  assert.match(xr, /^#[0-9a-f]{6}$/i)
  assert.notEqual(xr, '#FFFFFF')
})
