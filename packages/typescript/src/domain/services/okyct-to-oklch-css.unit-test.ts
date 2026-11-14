import test from 'node:test'
import assert from 'node:assert/strict'
import { okyctToOklchCss } from './okyct-to-oklch-css.ts'

test('okyctToOklchCss formats valid oklch(L% C H) CSS string', () => {
  const css = okyctToOklchCss({ h: 250, c: 0.14, t: 50 })
  assert.match(css, /^oklch\([0-9.]+% [0-9.]+ [0-9.]+\)$/)
})
