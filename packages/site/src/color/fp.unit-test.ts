import test from 'node:test'
import assert from 'node:assert/strict'
import { NamingCases, withPrefix } from './fp.ts'

test('color/fp facade re-exports FP token operators', () => {
  assert.deepEqual(NamingCases, ['kebab', 'camel', 'snake', 'constant'])
  assert.deepEqual(withPrefix('md-')({ primary: '#2563EB' }), { 'md-primary': '#2563EB' })
})
