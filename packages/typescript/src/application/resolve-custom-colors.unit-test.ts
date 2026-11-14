import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveCustomColors } from './resolve-custom-colors.ts'

test('resolveCustomColors produces light and dark tokens for custom brand colors', () => {
  const resolved = resolveCustomColors(
    [{ name: 'success', sourceHex: '#10B981', harmonize: true }],
    '#2563EB',
    { mode: 'light' }
  )
  assert.equal(resolved.length, 1)
  assert.equal(resolved[0].name, 'success')
  assert.match(resolved[0].color, /^#[0-9a-f]{6}$/i)
})
