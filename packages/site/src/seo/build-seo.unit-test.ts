import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('seo/build-seo.ts exports buildSeo returning SeoDescriptor', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'build-seo.ts'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+buildSeo/)
  assert.match(source, /SeoDescriptor/)
})
