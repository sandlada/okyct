/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 全局明暗主题。产品默认亮色模式（不跟随系统），
 * 通过根节点 dark 类驱动 Tailwind v4 自定义变体。
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark'

export const ThemeStorageKey = 'okyct.theme'

const ThemeContext = createContext<ThemeValue | null>(null)

interface ThemeValue {
  readonly theme: ThemeMode
  readonly isDark: boolean
  readonly setTheme: (mode: ThemeMode) => void
  readonly toggleTheme: () => void
}

export function readStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.localStorage.getItem(ThemeStorageKey)
  return raw === 'dark' || raw === 'light' ? raw : null
}

export function applyThemeClass(mode: ThemeMode): void {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeColor?.setAttribute('content', mode === 'dark' ? '#0a0a0a' : '#ffffff')
}

interface ThemeProviderProps {
  readonly children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = readStoredTheme()
    if (stored !== null && stored !== 'light') {
      setThemeState(stored)
      applyThemeClass(stored)
    }
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode)
    applyThemeClass(mode)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ThemeStorageKey, mode)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  const value = useMemo<ThemeValue>(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (value === null) {
    throw new Error('useTheme must be used inside a <ThemeProvider>')
  }
  return value
}
