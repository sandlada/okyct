import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('seo/index.ts re-exports site, build-seo, head-tags, and use-document-head', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.ts'),
    'utf8'
  )
  assert.match(source, /export \* from '\.\/site\.ts'/)
  assert.match(source, /export \* from '\.\/build-seo\.ts'/)
  assert.match(source, /export \* from '\.\/head-tags\.ts'/)
})
