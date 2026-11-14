import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('main.tsx mounts Root with hydrateRoot or createRoot', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'main.tsx'),
    'utf8'
  )
  assert.match(source, /Root/)
  assert.match(source, /createRoot|hydrateRoot/)
})
