import type { AppThunk } from '../../app/store.ts'
import { setTokenToast } from './slice.ts'

export function copyTokenText(text: string, toast: string): AppThunk {
  return (dispatch) => {
    void navigator.clipboard.writeText(text)
    dispatch(setTokenToast(toast))
    window.setTimeout(() => dispatch(setTokenToast(null)), 1800)
  }
}
