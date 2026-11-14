import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('ComponentShowcase.astro contains Astro template markup', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ComponentShowcase.astro'),
    'utf8'
  )
  assert.ok(source.length > 0)
  assert.match(source, /</)
})
