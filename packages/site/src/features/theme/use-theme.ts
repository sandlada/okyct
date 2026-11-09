import { applyTheme } from './slice.ts'
import { applyThemeClass, readStoredTheme, ThemeStorageKey, type ThemeMode } from './theme-dom.ts'
import type { AppThunk } from '../../app/store.ts'
import { useAppDispatch, useAppSelector } from '../../app/store.ts'

export type { ThemeMode }

export function commitTheme(mode: ThemeMode): AppThunk {
  return (dispatch) => {
    dispatch(applyTheme(mode))
    applyThemeClass(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ThemeStorageKey, mode)
    }
  }
}

export function hydrateTheme(): AppThunk {
  return (dispatch, getState) => {
    const stored = readStoredTheme()
    if (stored !== null && stored !== getState().theme.mode) {
      dispatch(applyTheme(stored))
      applyThemeClass(stored)
    }
  }
}

export function toggleTheme(): AppThunk {
  return (dispatch, getState) => {
    dispatch(commitTheme(getState().theme.mode === 'dark' ? 'light' : 'dark'))
  }
}

export function useTheme() {
  const theme = useAppSelector((state) => state.theme.mode)
  const dispatch = useAppDispatch()
  return {
    theme,
    isDark: theme === 'dark',
    setTheme: (mode: ThemeMode) => dispatch(commitTheme(mode)),
    toggleTheme: () => dispatch(toggleTheme()),
  }
}
