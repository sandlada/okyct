import test from 'node:test'
import assert from 'node:assert/strict'
import { ExportStudioSlug } from './routes.ts'

test('export/routes defines ExportStudioSlug', () => {
  assert.equal(ExportStudioSlug, 'export')
})
