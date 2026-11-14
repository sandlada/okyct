import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('router/index.tsx exports RouterProvider and useRouter', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+RouterProvider/)
  assert.match(source, /export\s+function\s+useRouter/)
})
