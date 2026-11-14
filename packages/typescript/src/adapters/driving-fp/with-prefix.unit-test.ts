import test from 'node:test'
import assert from 'node:assert/strict'
import { withPrefix } from './with-prefix.ts'

test('withPrefix prepends prefix to every key in token dictionary', () => {
  const out = withPrefix('sys-')({ primary: '#2563EB', surface: '#FFFFFF' })
  assert.deepEqual(out, { 'sys-primary': '#2563EB', 'sys-surface': '#FFFFFF' })
})
