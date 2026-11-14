import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('TransparencyView.tsx exports TransparencyView component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'TransparencyView.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+(const|function)\s+TransparencyView/)
})
