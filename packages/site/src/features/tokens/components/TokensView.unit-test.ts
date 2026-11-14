import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CurrentDir = dirname(fileURLToPath(import.meta.url))

describe('tokens/components/TokensView', () => {
  it('contains TokensView component export', () => {
    const source = readFileSync(join(CurrentDir, 'TokensView.tsx'), 'utf8')
    assert.match(source, /export function TokensView/)
  })
})
