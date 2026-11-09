import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ThemeMode } from './theme-dom.ts'

export interface ThemeState {
  mode: ThemeMode
}

const InitialThemeState: ThemeState = {
  mode: 'light',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: InitialThemeState,
  reducers: {
    applyTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload
    },
  },
})

export const { applyTheme } = themeSlice.actions
export const themeReducer = themeSlice.reducer
