import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('use-hue-scrubber.ts exports useHueScrubber hook', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'use-hue-scrubber.ts'),
    'utf8'
  )
  assert.match(source, /export function useHueScrubber/)
})
