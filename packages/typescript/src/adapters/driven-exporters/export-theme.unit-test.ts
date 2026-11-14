import test from 'node:test'
import assert from 'node:assert/strict'
import { createTheme } from '../create-theme.ts'
import { TokenExportFormats, exportTheme } from './export-theme.ts'

test('exportTheme dispatches to every supported TokenExportFormat', () => {
  const theme = createTheme('#2563EB')
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
  }
})
