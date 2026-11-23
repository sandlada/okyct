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

test('exportTailwindV4 throws on custom color collisions with system roles or other custom colors', () => {
  const sysCollision = createTheme({ sourceHex: '#2563EB', customColors: { primary: '#FF0000' } })
  assert.throws(() => sysCollision.export('tailwind'), /Token key collision in exportTailwindV4/)

  const customCollision = createTheme({
    sourceHex: '#2563EB',
    customColors: [
      { name: 'brandBlue', sourceHex: '#FF0000' },
      { name: 'brand-blue', sourceHex: '#00FF00' },
    ],
  })
  assert.throws(
    () =>
      exportTailwindV4(customCollision.schemes.light, customCollision.schemes.dark, {
        customColorsLight: customCollision.customColors.light,
        customColorsDark: customCollision.customColors.dark,
      }),
    /Token key collision in exportTailwindV4/
  )

  const derivedCollision = createTheme({
    sourceHex: '#2563EB',
    customColors: [
      { name: 'foo', sourceHex: '#FF0000' },
      { name: 'fooContainer', sourceHex: '#00FF00' },
    ],
  })
  assert.throws(() => derivedCollision.export('tailwind'), /Token key collision in exportTailwindV4/)
})
