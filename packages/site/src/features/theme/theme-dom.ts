export type ThemeMode = 'light' | 'dark'

export const ThemeStorageKey = 'okyct.theme'

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
