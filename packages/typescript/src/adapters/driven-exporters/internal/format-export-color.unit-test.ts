import test from 'node:test'
import assert from 'node:assert/strict'
import { formatColorValue, resolveExportColorFormat } from './format-export-color.ts'

test('resolveExportColorFormat validates supported CSS color formats', () => {
  assert.equal(resolveExportColorFormat(), 'hex')
  assert.equal(resolveExportColorFormat('oklch'), 'oklch')
  assert.equal(resolveExportColorFormat('display-p3'), 'display-p3')
  assert.throws(() => resolveExportColorFormat('rgb' as never))
})

test('formatColorValue emits hex, oklch(), and color(display-p3 ...) cleanly', () => {
  assert.equal(formatColorValue('#2563eb', 'hex'), '#2563eb')
  assert.match(formatColorValue('#2563eb', 'oklch'), /^oklch\(/)
  assert.match(formatColorValue('#2563eb', 'display-p3'), /^color\(display-p3 /)
  assert.match(
    formatColorValue('#2563eb', 'display-p3', { h: 145, c: 0.3, t: 75 }),
    /^color\(display-p3 /
  )
})
