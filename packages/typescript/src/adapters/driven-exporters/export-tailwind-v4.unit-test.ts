import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { exportTailwindV4 } from './export-tailwind-v4.ts'

test('exportTailwindV4 generates @theme block with color tokens', () => {
  const theme = createTheme('#2563EB')
  const tw = exportTailwindV4(theme.schemes.light, theme.schemes.dark)
  assert.match(tw, /@theme/)
  assert.match(tw, /--color-primary:/)
})

test('exportTailwindV4 supports oklch and display-p3 color formats', () => {
  const theme = createTheme({ sourceHex: '#2563EB', gamut: 'display-p3' })
  const twOklch = exportTailwindV4(theme.schemes.light, theme.schemes.dark, {
    colorFormat: 'oklch',
  })
  assert.match(twOklch, /--color-primary: var\(--md-sys-color-primary, light-dark\(oklch\(/)

  const twP3 = exportTailwindV4(theme.schemes.light, theme.schemes.dark, {
    colorFormat: 'display-p3',
  })
  assert.match(twP3, /--color-primary: var\(--md-sys-color-primary, light-dark\(color\(display-p3 /)
})
