import test from 'node:test'
import assert from 'node:assert/strict'
import { PreviewIcons, RailIcons } from './preview-icons.ts'

test('preview-icons exports SVG markup strings and RailIcons tuple', () => {
  assert.match(PreviewIcons.home, /^<svg/)
  assert.equal(RailIcons.length, 4)
})
