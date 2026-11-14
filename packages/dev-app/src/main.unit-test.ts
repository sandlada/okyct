import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('main.tsx mounts App into root element via createRoot', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'main.tsx'),
    'utf8'
  )
  assert.match(source, /createRoot/)
  assert.match(source, /App/)
})
