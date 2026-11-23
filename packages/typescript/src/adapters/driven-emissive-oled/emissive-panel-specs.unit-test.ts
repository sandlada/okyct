import test from 'node:test'
import assert from 'node:assert/strict'
import { EmissivePanelTypes } from '../../ports/index.ts'
import { EmissivePanelSpecs } from './emissive-panel-specs.ts'

test('EmissivePanelSpecs covers every EmissivePanelType', () => {
  for (const panel of EmissivePanelTypes) {
    assert.ok(EmissivePanelSpecs[panel])
  }
})
