import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface TokensState {
  toast: string | null
}

const InitialTokensState: TokensState = {
  toast: null,
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState: InitialTokensState,
  reducers: {
    setTokenToast(state, action: PayloadAction<string | null>) {
      state.toast = action.payload
    },
  },
})

export const { setTokenToast } = tokensSlice.actions
export const tokensReducer = tokensSlice.reducer
