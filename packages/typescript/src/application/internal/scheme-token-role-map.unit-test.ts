import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SchemeTokenRoleMap,
  StatefulTokenOverlayMap,
  formatStateLayerKey,
  normalizeStateLayerStates,
} from './scheme-token-role-map.ts'

test('scheme-token-role-map formats keys, normalizes states, and maps tokens', () => {
  assert.deepEqual(normalizeStateLayerStates(false), [])
  assert.equal(normalizeStateLayerStates(true).length, 4)
  assert.deepEqual(normalizeStateLayerStates(['hovered', 'hovered']), ['hovered'])
  assert.equal(formatStateLayerKey('onPrimary', 'hovered'), 'onPrimaryHovered')
  assert.equal(StatefulTokenOverlayMap.onPrimary, 'primary')
  assert.equal(SchemeTokenRoleMap.surface.kind, 'surface')
})
