import { createSelector } from '@reduxjs/toolkit'
import { exportCssVariables } from '../../color/exporter.ts'
import type { RootState } from '../../app/store.ts'
import {
  selectCustomDark,
  selectCustomLight,
  selectDarkScheme,
  selectLightScheme,
  selectPalettes,
  selectScheme,
} from '../studio/selectors.ts'
import { buildSamplePreviewDocument, type SamplePreviewCopy } from './build-sample-preview-document.ts'
import type { PagePreviewStrings } from './page-preview-strings.ts'
import { kebabCase } from './internal/kebab-case.ts'

export const selectPagePreviewData = createSelector(
  [
    selectScheme,
    selectCustomLight,
    selectCustomDark,
    (state: RootState) => state.theme.mode,
  ],
  (scheme, customLight, customDark, mode) => {
    const customs = mode === 'dark' ? customDark : customLight
    return {
      metricPrimary: scheme.primary.toUpperCase(),
      metricSecondary: scheme.secondary.toUpperCase(),
      metricTertiary: scheme.tertiary.toUpperCase(),
      listValues: [
        scheme.primary.toUpperCase(),
        scheme.error.toUpperCase(),
        scheme.tertiary.toUpperCase(),
      ],
      customChips: customs.slice(0, 2).map((color) => ({
        cssBase: kebabCase(color.name),
        label: color.label || color.name,
      })),
    }
  },
)

export const selectPagePreviewSrcDoc = createSelector(
  [
    selectPalettes,
    selectLightScheme,
    selectDarkScheme,
    selectCustomLight,
    selectCustomDark,
    (state: RootState) => state.theme.mode,
    selectPagePreviewData,
    (_state: RootState, strings: PagePreviewStrings) => strings,
  ],
  (palettes, light, dark, customLight, customDark, mode, data, strings) => {
    const tokenCss = exportCssVariables(light, dark, palettes, customLight, customDark, 'class')
    const copy: SamplePreviewCopy = { ...strings, ...data }
    return buildSamplePreviewDocument(tokenCss, mode, copy)
  },
)
