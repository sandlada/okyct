import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('SiteHeader.tsx exports SiteHeader component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'SiteHeader.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+SiteHeader|export\s+const\s+SiteHeader/)
})
