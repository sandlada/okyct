import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/store.ts'
import { applyThemeClass } from './theme-dom.ts'
import { hydrateTheme } from './use-theme.ts'

export function ThemeSync() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector((state) => state.theme.mode)
  const hydrated = useRef(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      dispatch(hydrateTheme())
      return
    }
    applyThemeClass(mode)
  }, [dispatch, mode])

  return null
}
