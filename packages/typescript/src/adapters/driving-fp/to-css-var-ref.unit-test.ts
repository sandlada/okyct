import test from 'node:test'
import assert from 'node:assert/strict'
import { toCssVarRef } from './to-css-var-ref.ts'

test('toCssVarRef maps token key to CSS var() reference', () => {
  assert.equal(toCssVarRef({ prefix: '--md-' })('primary'), 'var(--md-primary)')
  assert.equal(toCssVarRef({ fallback: '#000' })('surface'), 'var(--surface, #000)')
})
