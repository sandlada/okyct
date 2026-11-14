import test from 'node:test'
import assert from 'node:assert/strict'
import { withAlpha } from './with-alpha.ts'

test('withAlpha appends alpha hex or wraps CSS var in color-mix', () => {
  assert.equal(withAlpha(0.5)('#2563EB'), '#2563EB80')
  assert.match(withAlpha(0.5)('--primary'), /^color-mix\(in srgb,/)
})
