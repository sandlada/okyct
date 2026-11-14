import test from 'node:test'
import assert from 'node:assert/strict'
import { applyTheme, themeReducer } from './slice.ts'

test('themeReducer applies light and dark modes', () => {
  const initial = themeReducer(undefined, { type: '@@INIT' })
  const dark = themeReducer(initial, applyTheme('dark'))
  assert.equal(dark.mode, 'dark')
  const light = themeReducer(dark, applyTheme('light'))
  assert.equal(light.mode, 'light')
})
