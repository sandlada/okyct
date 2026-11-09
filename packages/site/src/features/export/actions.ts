import type { AppThunk } from '../../app/store.ts'
import { selectExportCode } from './selectors.ts'
import { setExportCopied } from './slice.ts'

export function copyExportCode(): AppThunk {
  return (dispatch, getState) => {
    void navigator.clipboard.writeText(selectExportCode(getState()))
    dispatch(setExportCopied(true))
    window.setTimeout(() => dispatch(setExportCopied(false)), 2000)
  }
}
