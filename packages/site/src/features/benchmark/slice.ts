import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getContrastRatio } from '../../color/math.ts'

export type YellowMode = 'naive' | 'okyct'

const benchmarkSlice = createSlice({
  name: 'benchmark',
  initialState: { yellowMode: 'okyct' as YellowMode },
  reducers: {
    setYellowMode(state, action: PayloadAction<YellowMode>) {
      state.yellowMode = action.payload
    },
    toggleYellowMode(state) {
      state.yellowMode = state.yellowMode === 'naive' ? 'okyct' : 'naive'
    },
  },
})

export const { setYellowMode, toggleYellowMode } = benchmarkSlice.actions
export const benchmarkReducer = benchmarkSlice.reducer

export const YellowDemo = {
  naive: '#FFD600',
  primary: '#705D00',
  container: '#FFE264',
  naiveContrast: getContrastRatio(92, 100),
  okyctContrast: getContrastRatio(40, 100),
} as const
