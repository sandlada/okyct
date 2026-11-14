import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface TokensState {
  toast: string | null
  showStateLayers: boolean
}

const InitialTokensState: TokensState = {
  toast: null,
  showStateLayers: false,
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState: InitialTokensState,
  reducers: {
    setTokenToast(state, action: PayloadAction<string | null>) {
      state.toast = action.payload
    },
    setShowStateLayers(state, action: PayloadAction<boolean>) {
      state.showStateLayers = action.payload
    },
  },
})

export const { setTokenToast, setShowStateLayers } = tokensSlice.actions
export const tokensReducer = tokensSlice.reducer
