import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const ScrollSpeeds = [
  { id: 'slow', pxPerSec: 70 },
  { id: 'standard', pxPerSec: 140 },
  { id: 'fast', pxPerSec: 280 },
] as const

export type ScrollSpeedId = (typeof ScrollSpeeds)[number]['id']

export interface OledState {
  running: boolean
  speedId: ScrollSpeedId
}

const InitialOledState: OledState = {
  running: true,
  speedId: 'standard',
}

const oledSlice = createSlice({
  name: 'oled',
  initialState: InitialOledState,
  reducers: {
    setOledRunning(state, action: PayloadAction<boolean>) {
      state.running = action.payload
    },
    toggleOledRunning(state) {
      state.running = !state.running
    },
    setOledSpeed(state, action: PayloadAction<ScrollSpeedId>) {
      state.speedId = action.payload
    },
  },
})

export const { setOledRunning, toggleOledRunning, setOledSpeed } = oledSlice.actions
export const oledReducer = oledSlice.reducer
