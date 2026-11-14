import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

test('seo/site.ts defines SiteName, SiteOwner, SiteUrl, and absoluteUrl', () => {
  const source = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'site.ts'),
    'utf8'
  )
  assert.match(source, /export const SiteName = 'OKYCT'/)
  assert.match(source, /export function absoluteUrl/)
})
