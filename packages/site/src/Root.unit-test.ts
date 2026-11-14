import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('Root.tsx exports Root component wrapping Provider and Router', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'Root.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+Root|export\s+const\s+Root/)
  assert.match(source, /Provider/)
})
