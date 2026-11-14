import test from 'node:test'
import assert from 'node:assert/strict'
import { GamutTargets, type GamutTarget } from './gamut-target.model.ts'

test('GamutTargets defines srgb and display-p3', () => {
  assert.deepEqual(GamutTargets, ['srgb', 'display-p3'])
  const target: GamutTarget = 'srgb'
  assert.ok(GamutTargets.includes(target))
})
