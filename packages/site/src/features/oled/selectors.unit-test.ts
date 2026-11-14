import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import { selectOledScreen } from './selectors.ts'

describe('oled/selectors', () => {
  it('derives oledColors and amoledColors from store state', () => {
    const store = createAppStore()
    const vm = selectOledScreen(store.getState())
    assert.match(vm.oledColors.bg, /^#[0-9a-f]{6}$/i)
    assert.match(vm.amoledColors.bg, /^#[0-9a-f]{6}$/i)
  })
})
