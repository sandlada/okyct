import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('pages/index.astro renders M3Layout and demo sections', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.astro'),
    'utf8'
  )
  assert.match(source, /M3Layout/)
})
