import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('index.css imports Tailwind CSS', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.css'),
    'utf8'
  )
  assert.match(source, /@import\s+["']tailwindcss["']/)
})
