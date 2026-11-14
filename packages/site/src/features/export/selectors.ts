import { createSelector } from '@reduxjs/toolkit'
import { exportTheme } from '../../color/exporter.ts'
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
  (ui, palettes, lightScheme, darkScheme, customColorsLight, customColorsDark) =>
    exportTheme(
      {
        lightScheme,
        darkScheme,
        palettes,
        customColorsLight,
        customColorsDark,
      },
      {
        format: ui.format,
        cssSchemeMode: ui.cssSchemeMode,
        tailwindFallback: ui.tailwindFallback,
        stateLayers: ui.stateLayers,
      }
    ),
)
