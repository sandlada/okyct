import test from 'node:test'
import assert from 'node:assert/strict'
import {
  NamingCases,
  filterTokens,
  mapTokens,
  pickTokens,
  renameCase,
  withPrefix,
} from './index.ts'

test('driving-fp barrel exports curried token dictionary operators', () => {
  assert.deepEqual(NamingCases, ['kebab', 'camel', 'snake', 'constant'])
  const dict = { primaryColor: '#2563EB', secondaryColor: '#10B981' }
  const out = withPrefix('md-')(renameCase('kebab')(pickTokens(['primaryColor'])(dict)))
  assert.deepEqual(out, { 'md-primary-color': '#2563EB' })
  assert.equal(typeof filterTokens, 'function')
  assert.equal(typeof mapTokens, 'function')
})
