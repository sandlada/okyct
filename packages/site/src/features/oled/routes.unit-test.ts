import test from 'node:test'
import assert from 'node:assert/strict'
import { OledLegacySlugs, OledStudioSlug } from './routes.ts'

test('oled/routes defines OledStudioSlug and legacy slugs', () => {
  assert.equal(OledStudioSlug, 'oled')
  assert.deepEqual(OledLegacySlugs, ['emissive'])
})
