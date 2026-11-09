import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { DefaultLandingSeed } from './palette.ts'

export interface LandingState {
  seedHex: string
}

const InitialLandingState: LandingState = {
  seedHex: DefaultLandingSeed,
}

const landingSlice = createSlice({
  name: 'landing',
  initialState: InitialLandingState,
  reducers: {
    setLandingSeed(state, action: PayloadAction<string>) {
      state.seedHex = action.payload
    },
  },
})

export const { setLandingSeed } = landingSlice.actions
export const landingReducer = landingSlice.reducer
