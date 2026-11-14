import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('ThemeSync.tsx exports ThemeSync component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ThemeSync.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+ThemeSync|export\s+const\s+ThemeSync/)
})
