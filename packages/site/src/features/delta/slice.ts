import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const DeltaPaletteKeys = [
  'primary',
  'secondary',
  'tertiary',
  'neutral',
  'neutralVariant',
  'error',
  'warning',
  'success',
  'info',
] as const

export type DeltaPaletteKey = (typeof DeltaPaletteKeys)[number]

export const DeltaScaleSourceKinds = [
  ...DeltaPaletteKeys,
  'custom-palette',
  'manual',
] as const

export type DeltaScaleSourceKind = (typeof DeltaScaleSourceKinds)[number]

export const DeltaSectionIds = [
  'all',
  'deltas',
  'coordinates',
  'accessibility',
  'emissive',
] as const

export type DeltaSectionId = (typeof DeltaSectionIds)[number]

const DefaultManualScaleA = [
  '#000000',
  '#0F172A',
  '#1E293B',
  '#334155',
  '#475569',
  '#64748B',
  '#94A3B8',
  '#CBD5E1',
  '#E2E8F0',
  '#F1F5F9',
  '#F8FAFC',
  '#FFFFFF',
].join(', ')

const DefaultManualScaleB = [
  '#000000',
  '#111827',
  '#1F2937',
  '#374151',
  '#4B5563',
  '#6B7280',
  '#9CA3AF',
  '#D1D5DB',
  '#E5E7EB',
  '#F3F4F6',
  '#F9FAFB',
  '#FFFFFF',
].join(', ')

export interface DeltaState {
  scaleASource: DeltaScaleSourceKind
  scaleACustomId: string
  scaleAManualInput: string
  compareEnabled: boolean
  scaleBSource: DeltaScaleSourceKind
  scaleBCustomId: string
  scaleBManualInput: string
  referenceHexInput: string
  applyEmissiveProfile: boolean
  activeSection: DeltaSectionId
  toast: string | null
}

const InitialState: DeltaState = {
  scaleASource: 'primary',
  scaleACustomId: '',
  scaleAManualInput: DefaultManualScaleA,
  compareEnabled: false,
  scaleBSource: 'secondary',
  scaleBCustomId: '',
  scaleBManualInput: DefaultManualScaleB,
  referenceHexInput: '#FFFFFF',
  applyEmissiveProfile: false,
  activeSection: 'all',
  toast: null,
}

const deltaSlice = createSlice({
  name: 'delta',
  initialState: InitialState,
  reducers: {
    setScaleASource(state, action: PayloadAction<DeltaScaleSourceKind>) {
      state.scaleASource = action.payload
    },
    setScaleACustomId(state, action: PayloadAction<string>) {
      state.scaleACustomId = action.payload
    },
    setScaleAManualInput(state, action: PayloadAction<string>) {
      state.scaleAManualInput = action.payload
    },
    setCompareEnabled(state, action: PayloadAction<boolean>) {
      state.compareEnabled = action.payload
    },
    setScaleBSource(state, action: PayloadAction<DeltaScaleSourceKind>) {
      state.scaleBSource = action.payload
    },
    setScaleBCustomId(state, action: PayloadAction<string>) {
      state.scaleBCustomId = action.payload
    },
    setScaleBManualInput(state, action: PayloadAction<string>) {
      state.scaleBManualInput = action.payload
    },
    setReferenceHexInput(state, action: PayloadAction<string>) {
      state.referenceHexInput = action.payload
    },
    setApplyEmissiveProfile(state, action: PayloadAction<boolean>) {
      state.applyEmissiveProfile = action.payload
    },
    setActiveSection(state, action: PayloadAction<DeltaSectionId>) {
      state.activeSection = action.payload
    },
    setDeltaToast(state, action: PayloadAction<string | null>) {
      state.toast = action.payload
    },
  },
})

export const {
  setScaleASource,
  setScaleACustomId,
  setScaleAManualInput,
  setCompareEnabled,
  setScaleBSource,
  setScaleBCustomId,
  setScaleBManualInput,
  setReferenceHexInput,
  setApplyEmissiveProfile,
  setActiveSection,
  setDeltaToast,
} = deltaSlice.actions

export const deltaReducer = deltaSlice.reducer
