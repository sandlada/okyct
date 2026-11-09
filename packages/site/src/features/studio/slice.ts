import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CvdType } from '../../color/benchmark.ts'
import type { EmissivePanelType } from '../../color/emissive.ts'
import type { PaletteVariant } from '../../color/palettes.ts'
import type { CustomColorConfig } from '../../color/scheme.ts'
import type { ExtractedSeedColor } from '../../color/imageQuantizer.ts'

export type { CvdType, EmissivePanelType, PaletteVariant, CustomColorConfig, ExtractedSeedColor }

export interface StudioState {
  sourceHex: string
  settledSourceHex: string
  variant: PaletteVariant
  contrastLevel: number
  settledContrastLevel: number
  harmonize: boolean
  cvdType: CvdType
  emissiveProfile: EmissivePanelType
  burnInGuard: boolean
  antiFringing: boolean
  customColors: CustomColorConfig[]
  mobileDrawerOpen: boolean
  quantizerSceneId: string
  extractedSeeds: ExtractedSeedColor[]
  customSeq: number
}

const CustomColorPool = ['#7E57C2', '#00897B', '#EC407A', '#5C6BC0'] as const

const InitialStudioState: StudioState = {
  sourceHex: '#1A73E8',
  settledSourceHex: '#1A73E8',
  variant: 'tonalSpot',
  contrastLevel: 0,
  settledContrastLevel: 0,
  harmonize: true,
  cvdType: 'none',
  emissiveProfile: 'amoled-anti-smear',
  burnInGuard: true,
  antiFringing: true,
  customColors: [],
  mobileDrawerOpen: false,
  quantizerSceneId: 'aurora',
  extractedSeeds: [],
  customSeq: 0,
}

const studioSlice = createSlice({
  name: 'studio',
  initialState: InitialStudioState,
  reducers: {
    setSourceHex(state, action: PayloadAction<string>) {
      state.sourceHex = action.payload
    },
    settleSourceHex(state, action: PayloadAction<string>) {
      if (state.sourceHex === action.payload) {
        state.settledSourceHex = action.payload
      }
    },
    setVariant(state, action: PayloadAction<PaletteVariant>) {
      state.variant = action.payload
    },
    setContrastLevel(state, action: PayloadAction<number>) {
      state.contrastLevel = action.payload
    },
    settleContrastLevel(state, action: PayloadAction<number>) {
      if (state.contrastLevel === action.payload) {
        state.settledContrastLevel = action.payload
      }
    },
    setHarmonize(state, action: PayloadAction<boolean>) {
      state.harmonize = action.payload
    },
    setCvdType(state, action: PayloadAction<CvdType>) {
      state.cvdType = action.payload
    },
    setEmissiveProfile(state, action: PayloadAction<EmissivePanelType>) {
      state.emissiveProfile = action.payload
    },
    setBurnInGuard(state, action: PayloadAction<boolean>) {
      state.burnInGuard = action.payload
    },
    setAntiFringing(state, action: PayloadAction<boolean>) {
      state.antiFringing = action.payload
    },
    addCustomColor(state, action: PayloadAction<string>) {
      state.customSeq += 1
      const index = state.customColors.length + 1
      state.customColors.push({
        id: `custom-${state.customSeq}`,
        name: `customRole${index}`,
        label: action.payload,
        sourceHex: CustomColorPool[(index - 1) % CustomColorPool.length],
        harmonize: true,
      })
    },
    updateCustomColor(state, action: PayloadAction<{ id: string; patch: Partial<CustomColorConfig> }>) {
      const target = state.customColors.find((item) => item.id === action.payload.id)
      if (target === undefined) {
        return
      }
      const patch = { ...action.payload.patch }
      if (patch.name !== undefined) {
        patch.name = patch.name.replace(/[^a-zA-Z0-9_-]/g, '')
      }
      Object.assign(target, patch)
    },
    removeCustomColor(state, action: PayloadAction<string>) {
      state.customColors = state.customColors.filter((item) => item.id !== action.payload)
    },
    setMobileDrawerOpen(state, action: PayloadAction<boolean>) {
      state.mobileDrawerOpen = action.payload
    },
    setQuantizerScene(state, action: PayloadAction<string>) {
      state.quantizerSceneId = action.payload
    },
    setExtractedSeeds(state, action: PayloadAction<ExtractedSeedColor[]>) {
      state.extractedSeeds = action.payload
    },
  },
})

export const {
  setSourceHex,
  settleSourceHex,
  setVariant,
  setContrastLevel,
  settleContrastLevel,
  setHarmonize,
  setCvdType,
  setEmissiveProfile,
  setBurnInGuard,
  setAntiFringing,
  addCustomColor,
  updateCustomColor,
  removeCustomColor,
  setMobileDrawerOpen,
  setQuantizerScene,
  setExtractedSeeds,
} = studioSlice.actions

export const studioReducer = studioSlice.reducer
