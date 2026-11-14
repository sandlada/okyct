import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('m3-global.css defines Material 3 CSS custom property rules', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'm3-global.css'),
    'utf8'
  )
  assert.match(source, /--md-sys-color-/)
})
