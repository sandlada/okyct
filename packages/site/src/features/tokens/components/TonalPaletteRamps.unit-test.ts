import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CurrentDir = dirname(fileURLToPath(import.meta.url))

describe('tokens/components/TonalPaletteRamps', () => {
  it('contains TonalPaletteRamps component export', () => {
    const source = readFileSync(join(CurrentDir, 'TonalPaletteRamps.tsx'), 'utf8')
    assert.match(source, /export function TonalPaletteRamps/)
  })
})
