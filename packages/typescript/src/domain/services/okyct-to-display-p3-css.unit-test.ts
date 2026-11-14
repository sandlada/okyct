import test from 'node:test'
import assert from 'node:assert/strict'
import { okyctToDisplayP3Css } from './okyct-to-display-p3-css.ts'

test('okyctToDisplayP3Css formats valid CSS color(display-p3 r g b) string', () => {
  const css = okyctToDisplayP3Css({ h: 250, c: 0.2, t: 50 })
  assert.match(css, /^color\(display-p3 [0-9.]+ [0-9.]+ [0-9.]+\)$/)
})
