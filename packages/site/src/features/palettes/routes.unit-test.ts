import test from 'node:test'
import assert from 'node:assert/strict'
import { PalettesStudioSlug } from './routes.ts'

test('palettes/routes defines PalettesStudioSlug', () => {
  assert.equal(PalettesStudioSlug, 'palettes')
})
