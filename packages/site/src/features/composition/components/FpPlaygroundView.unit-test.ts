import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('FpPlaygroundView.tsx exports FpPlaygroundView component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'FpPlaygroundView.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+(function|const)\s+FpPlaygroundView/)
})
