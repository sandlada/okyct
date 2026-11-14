import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PaletteVariants,
  StandardPaletteKeys,
  StandardTones,
  StateLayerStates,
  SystemColorTokens,
  ThemeModes,
} from './index.ts'

test('ports/inbound barrel re-exports palette, scheme, and layer-stacking contracts', () => {
  assert.equal(StandardTones.length, 13)
  assert.ok(PaletteVariants.includes('vibrant'))
  assert.ok(StandardPaletteKeys.includes('primary'))
  assert.deepEqual(ThemeModes, ['light', 'dark'])
  assert.deepEqual(StateLayerStates, ['hovered', 'focused', 'pressed', 'dragged'])
  assert.ok(SystemColorTokens.includes('surfaceContainer'))
})
