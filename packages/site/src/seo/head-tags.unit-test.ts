import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CurrentDir = dirname(fileURLToPath(import.meta.url))

describe('seo/head-tags', () => {
  it('exports renderHeadTags and applySeoToDocument', () => {
    const source = readFileSync(join(CurrentDir, 'head-tags.ts'), 'utf8')
    assert.match(source, /export function renderHeadTags/)
    assert.match(source, /export function applySeoToDocument/)
  })
})
