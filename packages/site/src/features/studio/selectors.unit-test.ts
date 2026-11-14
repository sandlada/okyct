import test from 'node:test'
import assert from 'node:assert/strict'
import { createAppStore } from '../../app/store.ts'
import {
  EmissivePanelIds,
  selectCustomDark,
  selectCustomLight,
  selectDarkScheme,
  selectEmissiveChoices,
  selectIsDark,
  selectLightScheme,
  selectPalettes,
  selectScheme,
} from './selectors.ts'

test('studio/selectors derive palettes, light/dark schemes, and custom colors from store state', () => {
  assert.ok(EmissivePanelIds.length > 0)
  assert.equal(selectEmissiveChoices.length, EmissivePanelIds.length)
  const store = createAppStore()
  const state = store.getState()
  assert.ok(selectPalettes(state).primary)
  assert.ok(selectScheme(state).primary)
  assert.ok(selectLightScheme(state).primary)
  assert.ok(selectDarkScheme(state).primary)
  assert.ok(Array.isArray(selectCustomLight(state)))
  assert.ok(Array.isArray(selectCustomDark(state)))
  assert.equal(typeof selectIsDark(state), 'boolean')
})
