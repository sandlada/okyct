import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { CssSchemeMode, TailwindFallbackMode } from '../../color/exporter.ts'

export const ExportFormats = ['css', 'tailwind', 'w3c', 'ts'] as const
export type ExportFormat = (typeof ExportFormats)[number]

export interface ExportState {
  format: ExportFormat
  cssSchemeMode: CssSchemeMode
  tailwindFallback: TailwindFallbackMode
  stateLayers: boolean
  copied: boolean
}

const InitialExportState: ExportState = {
  format: 'css',
  cssSchemeMode: 'light-dark',
  tailwindFallback: 'light-dark',
  stateLayers: false,
  copied: false,
}

const exportSlice = createSlice({
  name: 'export',
  initialState: InitialExportState,
  reducers: {
    setExportFormat(state, action: PayloadAction<ExportFormat>) {
      state.format = action.payload
    },
    setCssSchemeMode(state, action: PayloadAction<CssSchemeMode>) {
      state.cssSchemeMode = action.payload
    },
    setTailwindFallback(state, action: PayloadAction<TailwindFallbackMode>) {
      state.tailwindFallback = action.payload
    },
    setExportStateLayers(state, action: PayloadAction<boolean>) {
      state.stateLayers = action.payload
    },
    setExportCopied(state, action: PayloadAction<boolean>) {
      state.copied = action.payload
    },
  },
})

export const {
  setExportFormat,
  setCssSchemeMode,
  setTailwindFallback,
  setExportStateLayers,
  setExportCopied,
} = exportSlice.actions
export const exportReducer = exportSlice.reducer
