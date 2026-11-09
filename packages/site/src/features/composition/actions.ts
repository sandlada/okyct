import type { AppThunk } from '../../app/store.ts'
import { selectScheme } from '../studio/selectors.ts'
import { pushFpLayer, setFpCopied } from './slice.ts'

export function addFpLayer(label: string): AppThunk {
  return (dispatch, getState) => {
    dispatch(pushFpLayer({ color: selectScheme(getState()).tertiary, label }))
  }
}

export function copyFpText(text: string): AppThunk {
  return (dispatch) => {
    void navigator.clipboard.writeText(text)
    dispatch(setFpCopied(true))
    window.setTimeout(() => dispatch(setFpCopied(false)), 2000)
  }
}
