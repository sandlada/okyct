import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { benchmarkReducer } from '../features/benchmark/slice.ts'
import { followSchemeColors, compositionReducer } from '../features/composition/slice.ts'
import { deltaReducer } from '../features/delta/slice.ts'
import { exportReducer } from '../features/export/slice.ts'
import { landingReducer } from '../features/landing/slice.ts'
import { oledReducer } from '../features/oled/slice.ts'
import { selectScheme } from '../features/studio/selectors.ts'
import {
  setContrastLevel,
  setSourceHex,
  settleContrastLevel,
  settleSourceHex,
  studioReducer,
} from '../features/studio/slice.ts'
import { themeReducer } from '../features/theme/slice.ts'
import { tokensReducer } from '../features/tokens/slice.ts'

const rootReducer = combineReducers({
  theme: themeReducer,
  studio: studioReducer,
  landing: landingReducer,
  tokens: tokensReducer,
  composition: compositionReducer,
  export: exportReducer,
  oled: oledReducer,
  delta: deltaReducer,
  benchmark: benchmarkReducer,
})

export type RootState = ReturnType<typeof rootReducer>

export function createAppStore() {
  const listener = createListenerMiddleware<RootState>()

  listener.startListening({
    actionCreator: setSourceHex,
    effect: async (action, api) => {
      await api.delay(48)
      api.dispatch(settleSourceHex(action.payload))
    },
  })

  listener.startListening({
    actionCreator: setContrastLevel,
    effect: async (action, api) => {
      await api.delay(48)
      api.dispatch(settleContrastLevel(action.payload))
    },
  })

  listener.startListening({
    predicate: (_action, current, previous) =>
      selectScheme(current).primary !== selectScheme(previous).primary,
    effect: (_action, api) => {
      api.dispatch(followSchemeColors())
    },
  })

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listener.middleware),
  })
}

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<Result = void> = (dispatch: AppDispatch, getState: () => RootState) => Result

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
