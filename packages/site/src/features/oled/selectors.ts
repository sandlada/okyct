import { createSelector } from '@reduxjs/toolkit'
import { EMISSIVE_PANEL_SPECS } from '../../color/emissive.ts'
import { buildDynamicScheme } from '../../color/scheme.ts'
import type { RootState } from '../../app/store.ts'
import { selectPalettes, selectScheme } from '../studio/selectors.ts'

export interface ScrollColumnColors {
  bg: string
  row: string
  rowAlt: string
  accent: string
}

export const selectOledScreen = createSelector(
  [
    selectPalettes,
    selectScheme,
    (state: RootState) => state.studio.settledContrastLevel,
    (state: RootState) => state.studio.burnInGuard,
    (state: RootState) => state.studio.antiFringing,
    (state: RootState) => state.theme.mode,
    (state: RootState) => state.oled,
  ],
  (palettes, scheme, contrast, burnInGuard, antiFringing, mode, oled) => {
    const paint = (profile: 'oled-true-black' | 'amoled-anti-smear'): ScrollColumnColors => {
      const column = buildDynamicScheme(palettes, true, contrast, { profile, burnInGuard, antiFringing })
      return {
        bg: column.surface,
        row: column.surfaceContainerHigh,
        rowAlt: column.surfaceContainer,
        accent: scheme.primary,
      }
    }
    return {
      isDark: mode === 'dark',
      running: oled.running,
      speedId: oled.speedId,
      oledRiseMs: EMISSIVE_PANEL_SPECS['oled-true-black'].smearRiseTimeMs,
      amoledRiseMs: EMISSIVE_PANEL_SPECS['amoled-anti-smear'].smearRiseTimeMs,
      oledColors: paint('oled-true-black'),
      amoledColors: paint('amoled-anti-smear'),
    }
  },
)
