import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { TokenExportFormats, exportTheme } from './export-theme.ts'

test('exportTheme dispatches to every supported TokenExportFormat and colorFormat', () => {
  const theme = createTheme({ sourceHex: '#2563EB', gamut: 'display-p3' })
  for (const format of TokenExportFormats) {
    const out = exportTheme(
      {
        palettes: theme.palettes,
        lightScheme: theme.schemes.light,
        darkScheme: theme.schemes.dark,
        customColorsLight: theme.customColors.light,
        customColorsDark: theme.customColors.dark,
      },
      { format }
    )
    assert.ok(out.length > 50)

    const p3Out = exportTheme(theme, { format, colorFormat: 'display-p3' })
    assert.match(p3Out, /color\(display-p3 /)
  }
})
