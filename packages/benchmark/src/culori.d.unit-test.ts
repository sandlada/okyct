import test from 'node:test'
import assert from 'node:assert/strict'
import { converter, formatHex, parse } from 'culori'

test('culori declaration types allow parse, converter, and formatHex', () => {
  const toOklch = converter('oklch')
  const parsed = parse('#2563EB')
  assert.ok(parsed)
  const oklch = toOklch(parsed)
  assert.ok(oklch)
  assert.equal(formatHex(parsed), '#2563eb')
})
