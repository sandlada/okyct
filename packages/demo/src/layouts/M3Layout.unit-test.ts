import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('M3Layout.astro defines HTML layout shell', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'M3Layout.astro'),
    'utf8'
  )
  assert.match(source, /<html/)
  assert.match(source, /<slot\s*\/>/)
})
