import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('entry-server.tsx exports render function for SSR prerendering', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'entry-server.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+render/)
  assert.match(source, /renderToString/)
})
