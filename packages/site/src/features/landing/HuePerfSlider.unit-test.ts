import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('HuePerfSlider.tsx exports HuePerfSlider component', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'HuePerfSlider.tsx'),
    'utf8'
  )
  assert.match(source, /export\s+(function|const)\s+HuePerfSlider/)
})
