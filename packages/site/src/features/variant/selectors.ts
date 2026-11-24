import { createSelector } from '@reduxjs/toolkit'
import { buildDynamicScheme, type DynamicSchemeColors } from '../../color/scheme.ts'
import type { RootState } from '../../app/store.ts'
import { buildCustomPaletteSet, resolveAllRoleCoordinates } from './presets.ts'

const selectSettledHex = (state: RootState) => state.studio.settledSourceHex
const selectHarmonize = (state: RootState) => state.studio.harmonize
const selectSettledContrast = (state: RootState) => state.studio.settledContrastLevel
const selectProfile = (state: RootState) => state.studio.emissiveProfile
const selectBurnIn = (state: RootState) => state.studio.burnInGuard
const selectFringing = (state: RootState) => state.studio.antiFringing
const selectVariantRoles = (state: RootState) => state.variant.roles

export const selectCustomVariantRoleCoords = createSelector(
  [selectSettledHex, selectVariantRoles],
  (sourceHex, roles) => resolveAllRoleCoordinates(sourceHex, roles)
)

export const selectCustomVariantPaletteSet = createSelector(
  [selectSettledHex, selectVariantRoles, selectHarmonize],
  (sourceHex, roles, harmonize) => buildCustomPaletteSet(sourceHex, roles, harmonize)
)

export const selectCustomVariantSchemes = createSelector(
  [
    selectCustomVariantPaletteSet,
    selectSettledContrast,
    selectProfile,
    selectBurnIn,
    selectFringing,
  ],
  (
    palettes,
    contrastLevel,
    profile,
    burnInGuard,
    antiFringing
  ): { light: DynamicSchemeColors; dark: DynamicSchemeColors } => {
    const emissive = { profile, burnInGuard, antiFringing }
    return {
      light: buildDynamicScheme(palettes, { mode: 'light', contrastLevel, emissive }),
      dark: buildDynamicScheme(palettes, { mode: 'dark', contrastLevel, emissive }),
    }
  }
)
