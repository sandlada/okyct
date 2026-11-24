import { createSelector } from '@reduxjs/toolkit'
import { EmissivePanelSpecs, type EmissivePanelType } from '../../color/emissive.ts'
import { createPalettesFromSource } from '../../color/palettes.ts'
import {
  buildDynamicScheme,
  resolveCustomColors,
  type DynamicSchemeColors,
  type ResolvedCustomColor,
} from '../../color/scheme.ts'
import type { RootState } from '../../app/store.ts'
import { buildCustomPaletteSet } from '../variant/presets.ts'

export const EmissivePanelIds = [
  'standard-lcd',
  'oled-true-black',
  'amoled-anti-smear',
  'micro-oled-xr',
] as const satisfies readonly EmissivePanelType[]

export const selectEmissiveChoices = EmissivePanelIds.map((id) => ({
  id,
  description: EmissivePanelSpecs[id].description,
}))

const selectSettledHex = (state: RootState) => state.studio.settledSourceHex
const selectVariant = (state: RootState) => state.studio.variant
const selectHarmonize = (state: RootState) => state.studio.harmonize
const selectSettledContrast = (state: RootState) => state.studio.settledContrastLevel
const selectProfile = (state: RootState) => state.studio.emissiveProfile
const selectBurnIn = (state: RootState) => state.studio.burnInGuard
const selectFringing = (state: RootState) => state.studio.antiFringing
const selectThemeMode = (state: RootState) => state.theme.mode
const selectCustomColors = (state: RootState) => state.studio.customColors
const selectLiveHex = (state: RootState) => state.studio.sourceHex
const selectLiveContrast = (state: RootState) => state.studio.contrastLevel
const selectCustomVariantEnabled = (state: RootState) => state.variant.enabled
const selectCustomVariantRoles = (state: RootState) => state.variant.roles

export const selectPalettes = createSelector(
  [
    selectSettledHex,
    selectVariant,
    selectHarmonize,
    selectCustomVariantEnabled,
    selectCustomVariantRoles,
  ],
  (hex, variant, harmonize, customEnabled, customRoles) =>
    customEnabled
      ? buildCustomPaletteSet(hex, customRoles, harmonize)
      : createPalettesFromSource(hex, { variant, harmonizeSemantics: harmonize }),
)

const selectEmissiveOpts = createSelector(
  [selectProfile, selectBurnIn, selectFringing],
  (profile, burnInGuard, antiFringing) => ({ profile, burnInGuard, antiFringing }),
)

export const selectScheme = createSelector(
  [selectPalettes, selectThemeMode, selectSettledContrast, selectEmissiveOpts],
  (palettes, mode, contrast, opts): DynamicSchemeColors =>
    buildDynamicScheme(palettes, { mode, contrastLevel: contrast, emissive: opts }),
)

export const selectLightScheme = createSelector(
  [selectPalettes, selectSettledContrast, selectEmissiveOpts],
  (palettes, contrast, opts) =>
    buildDynamicScheme(palettes, { mode: 'light', contrastLevel: contrast, emissive: opts }),
)

export const selectDarkScheme = createSelector(
  [selectPalettes, selectSettledContrast, selectEmissiveOpts],
  (palettes, contrast, opts) =>
    buildDynamicScheme(palettes, { mode: 'dark', contrastLevel: contrast, emissive: opts }),
)

export const selectCustomLight = createSelector(
  [selectCustomColors, selectSettledHex, selectSettledContrast],
  (colors, hex, contrast): ResolvedCustomColor[] =>
    resolveCustomColors(colors, hex, { mode: 'light', contrastLevel: contrast }),
)

export const selectCustomDark = createSelector(
  [selectCustomColors, selectSettledHex, selectSettledContrast],
  (colors, hex, contrast) =>
    resolveCustomColors(colors, hex, { mode: 'dark', contrastLevel: contrast }),
)

export const selectSchemePending = createSelector(
  [selectLiveHex, selectSettledHex, selectLiveContrast, selectSettledContrast],
  (liveHex, settledHex, liveContrast, settledContrast) =>
    liveHex !== settledHex || liveContrast !== settledContrast,
)

export const selectIsDark = (state: RootState) => state.theme.mode === 'dark'
