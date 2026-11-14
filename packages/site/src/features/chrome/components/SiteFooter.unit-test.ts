import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('SiteFooter.tsx exports SiteFooter component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'SiteFooter.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+SiteFooter|export\s+const\s+SiteFooter/)
})
