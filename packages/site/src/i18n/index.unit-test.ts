import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('i18n/index.tsx exports I18nProvider and useI18n hook', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'index.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+function\s+I18nProvider/)
  assert.match(source, /export\s+function\s+useI18n/)
})
