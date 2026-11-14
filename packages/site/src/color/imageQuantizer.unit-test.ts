import test from 'node:test'
import assert from 'node:assert/strict'
import { PRESET_ART_SCENES, extractSeedsFromImageData } from './imageQuantizer.ts'

test('color/imageQuantizer exports PRESET_ART_SCENES and extractSeedsFromImageData', () => {
  assert.ok(PRESET_ART_SCENES.length > 0)
  assert.equal(typeof extractSeedsFromImageData, 'function')
})
