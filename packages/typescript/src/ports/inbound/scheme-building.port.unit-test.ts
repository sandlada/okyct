import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AmbientSurrounds,
  EmissivePanelTypes,
  StateLayerStates,
  StatefulSystemColorTokens,
  SystemColorTokens,
  ThemeModes,
} from './scheme-building.port.ts'

test('scheme-building port constants define modes, surrounds, panels, and tokens', () => {
  assert.deepEqual(ThemeModes, ['light', 'dark'])
  assert.deepEqual(AmbientSurrounds, ['bright', 'normal', 'darkroom'])
  assert.ok(EmissivePanelTypes.includes('oled-true-black'))
  assert.ok(EmissivePanelTypes.includes('amoled-anti-smear'))
  assert.ok(EmissivePanelTypes.includes('micro-oled-xr'))
  assert.deepEqual(StateLayerStates, ['hovered', 'focused', 'pressed', 'dragged'])
  assert.ok(SystemColorTokens.includes('primary'))
  assert.ok(SystemColorTokens.includes('onPrimary'))
  assert.ok(StatefulSystemColorTokens.includes('primary'))
})
