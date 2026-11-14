import test from 'node:test'
import assert from 'node:assert/strict'
import { GamutMappingModes, type GamutMappingMode } from './gamut-mapping-mode.model.ts'

test('GamutMappingModes defines preserve-tone and cusp-compress', () => {
  assert.deepEqual(GamutMappingModes, ['preserve-tone', 'cusp-compress'])
  const mode: GamutMappingMode = 'preserve-tone'
  assert.ok(GamutMappingModes.includes(mode))
})
