import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CurrentDir = dirname(fileURLToPath(import.meta.url))

describe('studio/components/StudioApp', () => {
  it('contains StudioApp default export', () => {
    const source = readFileSync(join(CurrentDir, 'StudioApp.tsx'), 'utf8')
    assert.match(source, /export default function StudioApp/)
  })
})
