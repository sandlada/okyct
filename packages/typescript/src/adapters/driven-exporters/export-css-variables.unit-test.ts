import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportCssVariables } from './export-css-variables.ts'

test('exportCssVariables generates CSS custom properties in class and light-dark modes', () => {
  const theme = createTheme('#2563EB')
  const css = exportCssVariables(
    theme.schemes.light,
    theme.schemes.dark,
    theme.palettes,
    [],
    [],
    'class'
  )
  assert.match(css, /--md-sys-color-primary:/)
  assert.match(css, /\.dark/)
})
