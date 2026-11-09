import { createSelector } from '@reduxjs/toolkit'
import {
  exportCssVariables,
  exportTailwindV4,
  exportTypeScriptTokens,
  exportW3cDesignTokens,
} from '../../color/exporter.ts'
import type { RootState } from '../../app/store.ts'
import {
  selectCustomDark,
  selectCustomLight,
  selectDarkScheme,
  selectLightScheme,
  selectPalettes,
} from '../studio/selectors.ts'

export const selectExportCode = createSelector(
  [
    (state: RootState) => state.export,
    selectPalettes,
    selectLightScheme,
    selectDarkScheme,
    selectCustomLight,
    selectCustomDark,
  ],
  (ui, palettes, light, dark, customLight, customDark) => {
    switch (ui.format) {
      case 'css':
        return exportCssVariables(light, dark, palettes, customLight, customDark, ui.cssSchemeMode)
      case 'tailwind':
        return exportTailwindV4(light, dark, customLight, customDark, ui.tailwindFallback)
      case 'w3c':
        return exportW3cDesignTokens(light, dark, customLight, customDark)
      case 'ts':
        return exportTypeScriptTokens(light, dark, customLight, customDark)
      default: {
        const unknown: never = ui.format
        throw new Error(`Unknown export format: ${String(unknown)}`)
      }
    }
  },
)
