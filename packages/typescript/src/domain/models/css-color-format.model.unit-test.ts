import test from 'node:test'
import assert from 'node:assert/strict'
import { CssColorFormats } from './css-color-format.model.ts'

test('CssColorFormats defines hex, oklch, and display-p3 formats', () => {
  assert.deepEqual(CssColorFormats, ['hex', 'oklch', 'display-p3'])
})
