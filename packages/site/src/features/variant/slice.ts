import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PaletteVariant } from '../../color/palettes.ts'
import {
  createPresetRoleMap,
  type VariantEditableRole,
  type VariantRoleMap,
  type VariantRoleOffsetConfig,
} from './presets.ts'

export interface VariantState {
  readonly enabled: boolean
  readonly basePreset: PaletteVariant
  readonly roles: VariantRoleMap
}

const InitialVariantState: VariantState = {
  enabled: false,
  basePreset: 'tonalSpot',
  roles: createPresetRoleMap('tonalSpot', false),
}

const variantSlice = createSlice({
  name: 'variant',
  initialState: InitialVariantState,
  reducers: {
    setCustomVariantEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload
    },
    loadVariantPreset(
      state,
      action: PayloadAction<{ variant: PaletteVariant; warmHue?: boolean; enable?: boolean }>
    ) {
      const { variant, warmHue = false, enable } = action.payload
      state.basePreset = variant
      state.roles = createPresetRoleMap(variant, warmHue)
      if (enable !== undefined) {
        state.enabled = enable
      }
    },
    updateRoleOffset(
      state,
      action: PayloadAction<{ role: VariantEditableRole; patch: Partial<VariantRoleOffsetConfig> }>
    ) {
      const { role, patch } = action.payload
      const current = state.roles[role]
      const next: VariantRoleOffsetConfig = {
        hueOffset:
          patch.hueOffset !== undefined
            ? Math.max(-180, Math.min(180, Math.round(patch.hueOffset)))
            : current.hueOffset,
        chromaScale:
          patch.chromaScale !== undefined
            ? Math.max(0, Math.min(2, Number(patch.chromaScale.toFixed(2))))
            : current.chromaScale,
        chromaMin:
          patch.chromaMin !== undefined
            ? Math.max(0, Math.min(0.4, Number(patch.chromaMin.toFixed(4))))
            : current.chromaMin,
        chromaMax:
          patch.chromaMax !== undefined
            ? Math.max(0, Math.min(0.4, Number(patch.chromaMax.toFixed(4))))
            : current.chromaMax,
      }
      state.roles[role] = next
      state.enabled = true
    },
    resetAllRoleOffsets(state, action: PayloadAction<{ warmHue?: boolean } | undefined>) {
      const warmHue = action.payload?.warmHue ?? false
      state.roles = createPresetRoleMap(state.basePreset, warmHue)
    },
  },
})

export const {
  setCustomVariantEnabled,
  loadVariantPreset,
  updateRoleOffset,
  resetAllRoleOffsets,
} = variantSlice.actions

export const variantReducer = variantSlice.reducer
