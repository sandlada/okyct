import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  setShowStateLayers,
  setTokenToast,
  tokensReducer,
} from './slice.ts'

describe('tokens/slice', () => {
  it('updates toast and showStateLayers state', () => {
    const initial = tokensReducer(undefined, { type: '@@INIT' })
    const withToast = tokensReducer(initial, setTokenToast('copied'))
    assert.equal(withToast.toast, 'copied')
    const toggled = tokensReducer(withToast, setShowStateLayers(false))
    assert.equal(toggled.showStateLayers, false)
  })
})
