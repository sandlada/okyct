import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('LocaleSwitcher.tsx exports LocaleSwitcher component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'LocaleSwitcher.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+LocaleSwitcher|export\s+const\s+LocaleSwitcher/)
})
