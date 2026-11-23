import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportCssVariables } from './export-css-variables.ts'

test('exportCssVariables generates CSS custom properties in class and light-dark modes', () => {
  const theme = createTheme('#2563EB')
  const css = exportCssVariables(theme.schemes.light, theme.schemes.dark, {
    palettes: theme.palettes,
    schemeMode: 'class',
  })
  assert.match(css, /--md-sys-color-primary: #[0-9a-f]{6};/i)
  assert.match(css, /\.dark/)
})

test('exportCssVariables supports oklch and display-p3 CSS Color 4 formats', () => {
  const theme = createTheme({ sourceHex: '#00C853', gamut: 'display-p3' })
  const oklchCss = exportCssVariables(theme.schemes.light, theme.schemes.dark, {
    palettes: theme.palettes,
    colorFormat: 'oklch',
  })
  assert.match(oklchCss, /--md-ref-palette-primary-40: oklch\(/)
  assert.match(oklchCss, /--md-sys-color-primary: light-dark\(oklch\(/)

  const p3Css = exportCssVariables(theme.schemes.light, theme.schemes.dark, {
    palettes: theme.palettes,
    colorFormat: 'display-p3',
  })
  assert.match(p3Css, /--md-ref-palette-primary-40: color\(display-p3 /)
  assert.match(p3Css, /--md-sys-color-primary: light-dark\(color\(display-p3 /)
})
