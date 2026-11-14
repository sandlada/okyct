import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('theme-client.ts integrates @sandlada/okyct createTheme for client-side theming', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'theme-client.ts'),
    'utf8'
  )
  assert.match(source, /createTheme/)
  assert.match(source, /@sandlada\/okyct/)
})
