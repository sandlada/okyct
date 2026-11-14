import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { commitTheme, toggleTheme } from './use-theme.ts'

test('use-theme thunks commitTheme and toggleTheme update store theme mode', () => {
  const store = createAppStore()
  store.dispatch(commitTheme('dark'))
  assert.equal(store.getState().theme.mode, 'dark')
  store.dispatch(toggleTheme())
  assert.equal(store.getState().theme.mode, 'light')
})
