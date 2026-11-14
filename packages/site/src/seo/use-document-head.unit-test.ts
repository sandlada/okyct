import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('seo/use-document-head.ts exports useDocumentHead hook', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'use-document-head.ts'),
    'utf8'
  )
  assert.match(source, /export function useDocumentHead/)
})
